import {Button} from 'primereact/button';
import {InputText} from 'primereact/inputtext';
import { useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { UserContext } from "../contexts/user.context";
import * as Realm from 'realm-web';
import { APP_ID } from "../realm/constants";

// Definition of the Login component
const Login = () => {
    // Navigation hooks from react-router-dom for routing
    const navigate = useNavigate();
    const location = useLocation();
    const app = new Realm.App({ id: APP_ID});

    // We are consuming our user-management context to
    // get & set the user details here
    const { user, fetchUser, emailPasswordLogin } = useContext(UserContext);

    // We are using React's "useState" hook to keep track
    //  of the form values.
    const [form, setForm] = useState({
        email: "",
        password: ""
    });

    // This function will be called whenever the user edits the form.
    const onFormInputChange = (event) => {
        const { name, value } = event.target;
        setForm({ ...form, [name]: value });
    };

    // This function will redirect the user to the
    // appropriate page once the authentication is done.
    const redirectNow = () => {
        const redirectTo = location.search.replace("?redirectTo=", "");
        navigate(redirectTo ? redirectTo : "/");
    }

    // Once a user logs in to our app, we don’t want to ask them for their
    // credentials again every time the user refreshes or revisits our app,
    // so we are checking if the user is already logged in and
    // if so we are redirecting the user to the home page.
    // Otherwise we will do nothing and let the user to login.
    const loadUser = async () => {
        if (!user) {
            const fetchedUser = await fetchUser();
            if (fetchedUser) {
                // Redirecting them once fetched.
                redirectNow();
            }
        }
    }

    // This useEffect will run only once when the component is mounted.
    // Hence this is helping us in verifying whether the user is already logged in
    // or not.
    useEffect(() => {
        loadUser(); // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // This function gets fired when the user clicks on the "Login" button.
    const onSubmit = async (event) => {
        try {
            // Here we are passing user details to our emailPasswordLogin
            // function that we imported from our realm/authentication.js
            // to validate the user credentials and log in the user into our App.
            const user = await emailPasswordLogin(form.email, form.password);
            if (user) {
                redirectNow();
            }
        } catch (error) {
            if (error.statusCode === 401) {
                alert("Invalid username/password. Try again!");
            } else {
                alert(error);
            }

        }
    };
    const email = form.email;
    const handlePasswordReset = async () => {
        if (!form.email) {
            alert('Please enter your email address.');
            return;
        }
        try {
            await app.emailPasswordAuth.sendResetPasswordEmail({email});
            alert('Password reset email sent successfully!');
        } catch (error) {
            console.error('Failed to send password reset email:', error);
            alert('Failed to send password reset email. Please try again.');
        }
    };

    return(
        <div className="card">
            <div className="flex flex-column md:flex-row">
                <div className="w-full md:w-5 flex flex-column align-items-s justify-content-center gap-3 py-5">
    
                    <h1>Login</h1>
                    <div className="flex flex-wrap justify-content-center align-items-center gap-2">
                        <label htmlFor="username" className="w-6rem">
                            Username
                        </label>
                    <InputText
                        label="Email"
                        type="email"
                        variant="outlined"
                        name="email"
                        value={form.email}
                        onChange={onFormInputChange}
                        style={{ marginBottom: "1rem" }}
                    />
                    </div>
                    <div className="flex flex-wrap justify-content-center align-items-center gap-2">
                        <label htmlFor="password" className="w-6rem">
                            Password
                        </label>
                    <InputText
                        label="Password"
                        type="password"
                        variant="outlined"
                        name="password"
                        value={form.password}
                        onChange={onFormInputChange}
                        style={{ marginBottom: "1rem" }}
                    />
                    </div>
                    <Button label="Login" icon="pi pi-user" className="w-10rem mx-auto" onClick={onSubmit}></Button>
                    <Button label="Forgot Password" icon="pi pi-question" className="w-10rem mx-auto" onClick={handlePasswordReset} />
        {/*<p>Don't have an account? <Link to="/signup">Signup</Link></p>*/}
                </div>
            </div>
        </div>

//         <section class="bg-gray-50 dark:bg-gray-900">
//   <div class="flex flex-col items-center justify-center px-6 py-8 mx-auto md:h-screen lg:py-0">
//       <div class="w-full bg-white rounded-lg shadow dark:border md:mt-0 sm:max-w-md xl:p-0 dark:bg-gray-800 dark:border-gray-700">
//           <div class="p-6 space-y-4 md:space-y-6 sm:p-8">
//               <h1 class="text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-2xl dark:text-white">
//                   Sign in to your account
//               </h1>
//               <form class="space-y-4 md:space-y-6" action="#">
//                   <div>
//                       <label for="email" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Your email</label>
//                       <InputText type="email" name="email" id="email" class="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="name@company.com" />
//                   </div>
//                   <div>
//                       <label for="password" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Password</label>
//                       <InputText type="password" name="password" id="password" placeholder="••••••••" class="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" />
//                   </div>
//                   <div class="flex items-center justify-between">
//                       {/* <div class="flex items-start">
//                           <div class="flex items-center h-5">
//                             <InputText id="remember" aria-describedby="remember" type="checkbox" class="w-4 h-4 border border-gray-300 rounded bg-gray-50 focus:ring-3 focus:ring-primary-300 dark:bg-gray-700 dark:border-gray-600 dark:focus:ring-primary-600 dark:ring-offset-gray-800" required=""/>
//                           </div>
//                           <div class="ml-3 text-sm">
//                             <label for="remember" class="text-gray-500 dark:text-gray-300">Remember me</label>
//                           </div>
//                       </div> */}
//                       <a href="#" class="text-sm font-medium text-primary-600 hover:underline dark:text-primary-500" onClick={handlePasswordReset} >Forgot password?</a>
//                   </div>
//                   <button type="submit" class="w-full text-white bg-primary-600 hover:bg-primary-700 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800" onClick={onSubmit}>Sign in</button> 
//               </form>
//           </div>
//       </div>
//   </div>
// </section>


    )
}

export default Login;