# Checking Integration with BITBUCKET - RONAK

import json
import os

import aiohttp
import boto3 as boto3
import uvicorn
from botocore.exceptions import NoCredentialsError, BotoCoreError, ClientError
from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, HTTPException, status, Form, Response, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.responses import StreamingResponse
from io import BytesIO
import zipfile
from pydantic import BaseModel
import logging
from logging.handlers import SysLogHandler

load_dotenv()
app = FastAPI()

origins = ['*']

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Replace these with your DigitalOcean Spaces credentials
ACCESS_KEY = os.getenv('ACCESS_KEY')
SECRET_KEY = os.getenv('SECRET_KEY')
BUCKET_NAME = os.getenv('BUCKET_NAME')
admin_username = os.getenv('admin_username')
admin_apiKey = os.getenv('admin_apiKey')
GROUP_ID = os.getenv('GROUP_ID')
APP_ID = os.getenv('APP_ID')

client = boto3.client(
    's3',
    # Replace with your Spaces region's endpoint
    endpoint_url='https://nyc3.digitaloceanspaces.com',
    aws_access_key_id=ACCESS_KEY,
    aws_secret_access_key=SECRET_KEY,
)


def logger_function(level, message):
    try:
        logger_comp = logging.getLogger('myapp')
        logger_comp.setLevel(logging.DEBUG)

        # Console handler
        console_handler = logging.StreamHandler()
        console_formatter = logging.Formatter('%(asctime)s %(levelname)s %(message)s', datefmt='%b %d %H:%M:%S')
        console_handler.setFormatter(console_formatter)
        logger_comp.addHandler(console_handler)

        # Papertrail handler
        papertrail_handler = SysLogHandler(address=('logs.papertrailapp.com', 35052))
        papertrail_formatter = logging.Formatter('%(asctime)s %(levelname)s %(message)s', datefmt='%b %d %H:%M:%S')
        papertrail_handler.setFormatter(papertrail_formatter)
        logger_comp.addHandler(papertrail_handler)

        logging.basicConfig(handlers=[papertrail_handler], level=logging.INFO)
        if level == "error":
            logger_comp.error(message)
        elif level == "warning":
            logger_comp.warning(message)
        elif level == "debug":
            logger_comp.debug(message)
        else:
            logger_comp.info(message)
    except Exception as e:
        # Handle any exception during logger setup
        print(f"Error setting up the logger: {e}")
        # Return a basic logger as a fallback
    return logging.getLogger('basicLogger')


class LogItem(BaseModel):
    level: str
    message: str


@app.get("/api/health")
async def health_check():
    # Check Local Storage
    local_folder_path = '/lss/baskarg-lab/onr-organic-muri/backup/'
    if not os.path.exists(local_folder_path) or not os.access(local_folder_path, os.W_OK):
        await receive_log(LogItem(level="error", message="Local storage not accessible"))
        return JSONResponse(content={"status": "error", "details": "Local storage not accessible"},
                            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # Check DigitalOcean Spaces
    try:
        client.list_buckets()  # Simple operation to check connectivity
    except (BotoCoreError, ClientError) as error:
        error_message = f"DigitalOcean Spaces not reachable: {str(error)}"
        await receive_log(LogItem(level="error", message=error_message))
        return JSONResponse(content={"status": "error", "details": error_message},
                            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # Check MongoDB
    admin_token_url = "https://realm.mongodb.com/api/admin/v3.0/auth/providers/mongodb-cloud/login"
    data = {"username": admin_username, "apiKey": admin_apiKey}
    async with aiohttp.ClientSession() as session:
        async with session.post(admin_token_url, json=data) as response:
            if response.status != 200:
                error_message = "MongoDB not reachable"
                await receive_log(LogItem(level="error", message=error_message))
                return JSONResponse(content={"status": "error", "details": error_message},
                                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)

    return JSONResponse(content={"status": "healthy"}, status_code=status.HTTP_200_OK)


@app.post("/api/log")
async def receive_log(log_item: LogItem):
    level = log_item.level
    message = log_item.message

    # Forward log to Papertrail
    logger_function(level.lower(), message)
    # ... add other log levels if needed

    return {"message": "Log received and forwarded to Papertrail"}


async def verify_token(user_token):
    admin_token_url = "https://realm.mongodb.com/api/admin/v3.0/auth/providers/mongodb-cloud/login"
    data = {
        "username": admin_username,
        "apiKey": admin_apiKey
    }
    async with aiohttp.ClientSession() as session:

        async with session.post(admin_token_url, json=data) as response:
            if response.status == 200:
                admin_token = await response.json()
            else:
                return response
        admin_access_token = admin_token["access_token"]
    headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + admin_access_token
    }
    payload = json.dumps({
        "token": user_token
    })
    client_verify_token_url = f"https://realm.mongodb.com/api/admin/v3.0/groups/{GROUP_ID}/apps/{APP_ID}/users/verify_token"
    async with aiohttp.ClientSession() as session:
        async with session.post(client_verify_token_url, headers=headers, data=payload) as response:
            if response.status == 200:
                return 200
            else:
                logger_function("error", f"Error verifying token: {response.status}")
                return response


@app.post("/api/upload_file/")
async def upload_file(folder: str = Form(...), token: str = Form(...), file: UploadFile = File(...)):
    try:
        # Check if the folder exists
        token_status = await verify_token(token)
        if token_status != 200:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
        folder_exists = False

        for obj in client.list_objects(Bucket=BUCKET_NAME)['Contents']:
            if obj['Key'].startswith(folder + '/'):
                folder_exists = True
                break

        # If folder does not exist, create it
        if not folder_exists:
            client.put_object(Bucket=BUCKET_NAME, Key=(folder + '/'))

        # Upload the file to the folder
        file_content = await file.read()
        file_key = f'{folder}/{file.filename}'
        client.put_object(Bucket=BUCKET_NAME, Key=file_key, Body=file_content)

        # Save file in local folder
        local_folder_path = '/lss/baskarg-lab/onr-organic-muri/backup/' + folder
        os.makedirs(local_folder_path, exist_ok=True)
        local_file_path = os.path.join(local_folder_path, file.filename)
        with open(local_file_path, 'wb') as local_file:
            local_file.write(file_content)

        logger_function("info", f"File {file.filename} uploaded successfully to {folder}")
        return JSONResponse(content={"message": "File uploaded successfully!"}, status_code=200)
    except NoCredentialsError as e:
        logger_function("error", f"No AWS credentials found: {str(e)}")
        return {"error": "No AWS credentials found"}
    except Exception as e:
        # Log any other exception
        logger_function("error", f"Error uploading file {file.filename}: {str(e)}")
        return {"error": str(e)}


@app.post("/api/generate_download_link/")
async def generate_download_link(request: Request):
    body = await request.json()
    file_path = body.get('filePath')
    token = body.get('token')
    # Verify the token
    token_status = await verify_token(token)
    if token_status != 200:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    # Generate a presigned URL for downloading the file
    try:
        url = client.generate_presigned_url('get_object',
                                            Params={'Bucket': BUCKET_NAME, 'Key': file_path}, ExpiresIn=604800
                                            )
        return JSONResponse(content={"url": url}, status_code=200)

    except Exception as e:
        logger_function("error", f"error in generating download link {str(e)}")
        return {"error": str(e)}


@app.post("/api/download_folder/")
async def download_folder(request: Request):
    try:
        body = await request.json()
        folder = body.get('folder')
        print(folder)
        token = body.get('token')
        token_status = await verify_token(token)
        if token_status != 200:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

        # Create a BytesIO object to store the zip file
        in_memory_zip = BytesIO()

        with zipfile.ZipFile(in_memory_zip, mode="w", compression=zipfile.ZIP_DEFLATED) as zf:
            for obj in client.list_objects(Bucket=BUCKET_NAME, Prefix=f"{folder}/")['Contents']:
                file_key = obj['Key']
                file_obj = client.get_object(Bucket=BUCKET_NAME, Key=file_key)
                file_data = file_obj['Body'].read()
                zf.writestr(file_key, file_data)

        in_memory_zip.seek(0)

        headers = {
            'Content-Disposition': f'attachment; filename={folder}.zip'
        }

        return Response(content=in_memory_zip.getvalue(), media_type="application/zip", headers=headers)
    except NoCredentialsError as e:
        logger_function("error", f"Error downloading folder {str(e)}")
        return {"error": "No AWS credentials found"}
    except Exception as e:
        logger_function("error", f"Error downloading folder {str(e)}")
        return {"error": str(e)}


if __name__ == "__main__":
    uvicorn.run(app, host='0.0.0.0', port=8000)
