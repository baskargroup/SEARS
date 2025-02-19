import {Button} from "primereact/button";
import React, {useContext, useEffect, useRef, useState} from "react";
import {Dialog} from "primereact/dialog";
import {InputText} from "primereact/inputtext";
import {UserContext} from "../contexts/user.context";
import {Toast} from "primereact/toast";
import {classNames} from "primereact/utils";
import {Calendar} from "primereact/calendar";
import {sendLogToServer} from "./sendLogToServer";
import { Accordion, AccordionTab } from 'primereact/accordion';
        

export function DataForm(){
    // Initial empty product structure
    let emptyProduct = {
        experiment_name: '',
        experiment_dt: null,
        experiment_location: '',
        polymer_name: '',
        polymer_mw: '',
        polymer_rr: '',
        polymer_batch: '',
        polymer_company: '',
        solvent: '',
        dopant_name: '',
        dopant_batch: '',
        dopant_company: '',
        loading_polymer: '',
        loading_dopant: '',
        loading_solvent: '',
        temperature: '',
        print_speed: '',
        print_voltage: '',
        print_head_diameter: '',
        exposure_time: '',
        substrate_name: '',
        substrate_company: '',
        annealing_temperature: '',
        annealing_duration: '',
        fab_box: '',
        fab_humidity: '',
        other: '',
        uv_vis_nir_files : [],
        iv_files : [],
        profilometry_files : [],
        giwaxs_files : [],
        skpm_files : [],
        solvents: [{ name: '', value: '' }],
        "thickness": [
            {
              "batch": "Please enter batch number",
              "reading": "Please enter reading",
              "who": "Please enter your group name"
            }
          ],
          "uv_vis_nir": [
            {
              "batch": "Please enter batch number",
              "reading": "Please enter reading",
              "who": "Please enter your group name",
              "file": "Please enter file name"
            }
          ],
          "giwaxs": [
            {
              "batch": "Please enter batch number",
              "reading": "Please enter reading",
              "who": "Please enter your group name",
              "filetype": "1D or 2D",
              "file": "Please enter file name"
            }
          ],
          "skpm": [
            {
              "batch": "Please enter batch number",
              "reading": "Please enter reading",
              "who": "Please enter your group name",
              "file": "Please enter file name"
            }
          ],
          "iv": [
            {
              "batch": "Please enter batch number",
              "reading": "Please enter reading",
              "who": "Please enter your group name",
              "file": "Please enter file name"
            }
          ],
          "profilometry": [
            {
              "batch": "Please enter batch number",
              "reading": "Please enter reading",
              "who": "Please enter your group name",
              "file": "Please enter file name"
            }
          ],
          "conductivity": [
            {
              "batch": "Please enter batch number",
              "reading": "Please enter reading",
              "who": "Please enter your group name"
            }
          ],
          "mobility" : [
            {
              "batch": "Please enter batch number",
              "reading": "Please enter reading",
              "who": "Please enter your group name"
            }
          ]
    };

    // State and context hooks
    const {user} = useContext(UserContext); //The user context allows to call the MongoDB functions using axios
    const [submitted, setSubmitted] = useState(false);
    const [productDialog, setProductDialog] = useState(false);
    const toast = useRef(null);
    const [product, setProduct] = useState(emptyProduct); //This is used to store the product information. The entire JSON object is stored here.
    const [expName, setexpName] = useState(''); //This is used for the copy as a template feature
    
    // Open the product dialog
    const openNew = () => {
        setProduct(emptyProduct);
        setSubmitted(false);
        setProductDialog(true);
    };

    // The next two functions are used to fetch the data from the database and populate the fields for the copy as a template feature.
    const displayProductData = async (e) => {
        try {
            const functionName = "getProductIdInfo"; // This is defined in MongoDB Atlas. Login to MongoDB Atlas and check the function details.
            // We are passing the experiment name from the hook to the MongoDB atlas function.
            let result = await user.callFunction(functionName, expName);
            result = JSON.parse(JSON.stringify(result));
            
            //Populate some of the fields with the fetched data
            document.getElementById('polymer_name').value = result[0].polymer_name;
            document.getElementById('polymer_mw').value = result[0].polymer_mw;
            document.getElementById('polymer_rr').value = result[0].polymer_rr;
            document.getElementById('dopant_name').value = result[0].dopant_name;
            document.getElementById('dopant_batch').value = result[0].dopant_batch;
            document.getElementById('dopant_company').value = result[0].dopant_company;
            document.getElementById('loading_polymer').value = result[0].loading_polymer;
            document.getElementById('loading_dopant').value = result[0].loading_dopant;
            document.getElementById('loading_solvent').value = result[0].loading_solvent;
            document.getElementById('temperature').value = result[0].temperature;
            document.getElementById('print_speed').value = result[0].print_speed;
            document.getElementById('print_voltage').value = result[0].print_voltage;
            document.getElementById('print_head_diameter').value = result[0].print_head_diameter;
            document.getElementById('exposure_time').value = result[0].exposure_time;
            document.getElementById('substrate_name').value = result[0].substrate_name;
            document.getElementById('substrate_company').value = result[0].substrate_company;
            document.getElementById('annealing_temperature').value = result[0].annealing_temperature;
            document.getElementById('annealing_duration').value = result[0].annealing_duration;
            document.getElementById('fab_box').value = result[0].fab_box;
            document.getElementById('fab_humidity').value = result[0].fab_humidity;
            toast.current.show({severity: 'success', summary: 'Data fetch Successful', detail: 'Product data fetched', life: 3000});
        } catch (error) {
            console.error('Failed to fetch product data:', error);
            await sendLogToServer('error', `Failed to fetch product data: ${error.message}`);
            toast.current.show({severity: 'error', summary: 'Error Message', detail: 'Error while fetching experiment data', life: 3000});
        }
    };

    const handleInputChange = (e) => {
        setexpName(e.target.value);
      };

    // Save product information
    const saveProduct = async () => {
        setSubmitted(true);
        if (product.polymer_name.trim()) {
            try {
                    // Fetch the product object from the hook
                    let _product = {...product};
                    // Call the MongoDB atlas function to save the product information
                    const functionName = "putProductInfo";
                    const args = [_product];
                    // Call the MongoDB atlas function to save the product information
                    let result = await user.callFunction(functionName, ...args);
                    // Parse the result and update the product object with the inserted ID
                    result = JSON.parse(JSON.stringify(result));
                    _product.id = result['insertedId'];
                    
                    // Send the success log to the backend
                    await sendLogToServer('error', `Product created successfully: ${JSON.stringify(_product)}`);
                    // Toast message
                    toast.current.show({severity: 'success', summary: 'Successful', detail: 'Product Created', life: 3000});
                    // Close the dialog
                    setProductDialog(false);
                    // Reset the product object
                    setProduct(emptyProduct);

            } catch (error) {
                console.error('Failed to save product:', error);
                await sendLogToServer('error', `Failed to create a new experiment: ${error.message}`);
                // Toast message
                toast.current.show({severity: 'error', summary: 'Error Message', detail: 'Error while creating a new product', life: 3000});
            }
        }
    };

    // Dialog footer with action buttons
    const productDialogFooter = (
        <React.Fragment>
            <Button label="Cancel" icon="pi pi-times" outlined onClick={hideProductDialog} />
            <Button label="Save" icon="pi pi-check" onClick={saveProduct} />
        </React.Fragment>
    );

    // Handle input change
    const onInputChange = (e, name) => {
        const val = (e.target && e.target.value) || '';
        //Get the current product object from the hook
        let _product = { ...product };
        // Update the product object (from hook) with the new value
        _product[`${name}`] = val;
        // Update the hook with the new product object
        setProduct(_product);
    };

    // Hide product dialog
    function hideProductDialog() {
        setSubmitted(false);
        setProductDialog(false);
    }

    // Handle solvent changes
    const handleSolventChange = (e, index, field) => {
        const newSolvents = [...product.solvents];
        newSolvents[index][field] = e.target.value;
        setProduct({ ...product, solvents: newSolvents });
    };

    // Add a new solvent field
    const addSolvent = () => {
        setProduct({
            ...product,
            solvents: [...product.solvents, { name: '', value: '', mol_wt: '', smiles: '', hsp_delta_d: '', hsp_delta_p: '', hsp_delta_h: '' }],
        });
    };

    // Remove a solvent field
    const removeSolvent = (index) => {
        const newSolvents = [...product.solvents];
        newSolvents.splice(index, 1);
        setProduct({ ...product, solvents: newSolvents });
    };

    // Calculate the sum of solvent values
    const totalSolventValue = product.solvents.reduce((sum, solvent) => sum + (parseInt(solvent.value, 10) || 0), 0);

    // Component rendering
    return(

        <div>
            <Toast ref={toast} />
            <Button label="New" icon="pi pi-plus" severity="success" onClick={openNew} />
            <Dialog visible={productDialog} style={{ width: '64rem' }} breakpoints={{ '960px': '75vw', '641px': '90vw' }} header="" modal className="p-fluid" footer={productDialogFooter} onHide={hideProductDialog}>
                <div className="head">
                    <h1 className="h"> METADATA </h1>
                </div>

                <div className="font-bold underline">
                    Copy settings from an existing experiment (if applicable):
                </div>
                <div className="container">
                    <div className="container">
                        <label htmlFor="search_experiment_name" className="text">
                            Search by experiment name
                        </label>
                        <InputText className="textbox" id="search_experiment_name" value={expName} placeholder="Please enter the experiment name"  onChange={handleInputChange} style={{ width: '400px', padding: '5px' }} />
                    </div>
                    <div className="container">
                        <Button label="Copy as a template" icon="pi pi-check" onClick={displayProductData} />
                    </div>
                </div>

                <div className="font-bold underline">
                    Experiment Info:
                </div>
                <div className="container">
                    <div className="container">
                        <label htmlFor="experiment_name" className="text" >
                            Name
                        </label>
                        <InputText className="textbox" id="experiment_name" value={product.experiment_name} onChange={(e) => onInputChange(e, 'experiment_name')}  />
                    </div>
                
                    <div className="container">
                        <label htmlFor="experiment_dt" className="text">
                           Date/Time <font color="red">*</font>
                        </label>
                        <Calendar className="textbox" value={product.experiment_dt} onChange={(e) => onInputChange(e, 'experiment_dt')} showTime hourFormat="24" />
                        {submitted && !product.experiment_dt && <small className="p-error">Date and time are required.</small>}
                    </div>
                    <div className="container">
                        <label htmlFor="experiment_location" className="text">
                            Lab
                        </label>
                        <InputText className="textbox" id="experiment_location" value={product.experiment_location} onChange={(e) => onInputChange(e, 'experiment_location')}  />
                    </div>
                </div>
                <div className="font-bold underline">
                    Polymer Info:
                </div>
                <div className="container">
                    <div className="container">
                        <label htmlFor="polymer_name" className="text">
                            Name<font color="red">*</font>
                        </label>
                        <InputText className="textbox" id="polymer_name" value={product.polymer_name} onChange={(e) => onInputChange(e, 'polymer_name')}    />
                        {submitted && !product.polymer_name && <small className="p-error">Polymer name is required.</small>}
                    </div>

                    <div className="container">
                        <label htmlFor="polymer_mw" className="text">
                            MW
                        </label>
                        <InputText className="textbox" id="polymer_mw" value={product.polymer_mw} onChange={(e) => onInputChange(e, 'polymer_mw')}   />
                    </div>

                    <div className="container">
                        <label htmlFor="polymer_rr" className="text">
                            RR
                        </label>
                        <InputText className="textbox" id="polymer_rr" value={product.polymer_rr} onChange={(e) => onInputChange(e, 'polymer_rr')}   />
                    </div>
                </div>
                {/* <div className="field">
                    <label htmlFor="polymer_mw" className="font-bold">
                        MW
                    </label>
                    <InputText id="polymer_mw" value={product.polymer_mw} onChange={(e) => onInputChange(e, 'polymer_mw')}   />
                </div>
                <div className="field">
                    <label htmlFor="polymer_rr" className="font-bold">
                        RR
                    </label>
                    <InputText id="polymer_rr" value={product.polymer_rr} onChange={(e) => onInputChange(e, 'polymer_rr')}   />
                </div>
                <div className="field">
                    <label htmlFor="polymer_batch" className="font-bold">
                        Batch
                    </label>
                    <InputText id="polymer_batch" value={product.polymer_batch} onChange={(e) => onInputChange(e, 'polymer_batch')}  />
                </div>
                <div className="field">
                    <label htmlFor="polymer_company" className="font-bold">
                        Company
                    </label>
                    <InputText id="polymer_company" value={product.polymer_company} onChange={(e) => onInputChange(e, 'polymer_company')}  />
                </div> */}
                
                <div className="field">
                    <label htmlFor="solvent" className="font-bold underline">
                        Solvent/co-solvent info :
                    </label>
                    <div className="container">
                    {totalSolventValue !== 100 && (
                            <div style={{ color: 'red', padding:'12px', fontWeight: 'bold' }}>
                                Solvent values must add up to 100. Current total: {totalSolventValue}
                           </div>
                     )}
                    </div>
                    <div className="container">
                        {product.solvents.map((solvent, index) => (
                            <div key={index}>
                                 <div style={{ border: "2px solid red", padding: "10px", borderRadius: "8px" }}>
                                <div style = {{padding : '1px'}}>
                                <InputText
                                className="textbox"
                                    placeholder="Name"
                                    value={solvent.name}
                                    onChange={(e) => handleSolventChange(e, index, 'name')}
                                    style = {{fontSize: '13px', fontStyle: 'italic'}} 
                                />
                                </div>
                                <div style = {{padding : '1px'}}>
                                <InputText
                                className="textbox"
                                    placeholder="Value"
                                    value={solvent.value}
                                    onChange={(e) => handleSolventChange(e, index, 'value')}
                                    style = {{fontSize: '13px', fontStyle: 'italic'}} 
                                />
                                </div>
                                 <div style = {{padding : '1px'}}>
                                 <InputText
                                className="textbox"
                                    placeholder="Mol. Wt. g/mol"
                                    value={solvent.mol_wt}
                                    onChange={(e) => handleSolventChange(e, index, 'mol_wt')}
                                    style = {{fontSize: '13px', fontStyle: 'italic'}} 
                                />
                                </div>
                                <div style = {{padding : '1px'}}>
                                 <InputText
                                className="textbox"
                                    placeholder="Smiles String"
                                    value={solvent.smiles}
                                    onChange={(e) => handleSolventChange(e, index, 'smiles')}
                                    style = {{fontSize: '13px', fontStyle: 'italic'}} 
                                />
                                </div>
                                <div style = {{padding : '1px'}}>
                                <InputText
                                className="textbox"
                                    placeholder="HSP-Delta(d) √MPa"
                                    value={solvent.hsp_delta_d}
                                    onChange={(e) => handleSolventChange(e, index, 'hsp_delta_d')}
                                    style = {{fontSize: '13px', fontStyle: 'italic'}} 
                                />
                                </div>
                                <div style = {{padding : '1px'}}>
                                 <InputText
                                className="textbox"
                                    placeholder="HSP-Delta(p) √MPa"
                                    value={solvent.hsp_delta_p} 
                                    onChange={(e) => handleSolventChange(e, index, 'hsp_delta_p')}
                                    style = {{fontSize: '13px', fontStyle: 'italic'}} 
                                />
                                </div>
                                <div style = {{padding : '1px'}}>
                                 <InputText
                                className="textbox"
                                    placeholder="HSP-Delta(h) √MPa"
                                    value={solvent.hsp_delta_h}
                                    onChange={(e) => handleSolventChange(e, index, 'hsp_delta_h')}
                                    style = {{fontSize: '13px', fontStyle: 'italic'}} 
                                />
                                </div>
                                {product.solvents.length > 1 && (
                                    <div style = {{padding: '2px'}}>
                                    <Button
                                        label="Remove"
                                        onClick={() => removeSolvent(index)}
                                    />
                                    </div>
                                )}
                                </div>
                            </div>
                        ))}
                        {totalSolventValue < 100 && (
                            <div style = {{padding: '30px'}}>
                                <Button label="Add"  onClick={addSolvent} />
                            </div>
                        )}
                       {/* {totalSolventValue !== 100 && (
                            <div style={{ color: 'red', padding:'12px', fontWeight: 'bold' }}>
                                Solvent values must add up to 100. Current total: {totalSolventValue}
                           </div>
                     )} */}
                    </div>
                </div>
                <div className="font-bold underline">
                    Dopant Info:
                </div>
                <div className="container">
                    <div className="container">
                        <label htmlFor="dopant_name" className="text">
                            Name
                        </label>
                        <InputText className="textbox" id="dopant_name" value={product.dopant_name} onChange={(e) => onInputChange(e, 'dopant_name')}  />
                    </div>
                    <div className="container">
                        <label htmlFor="dopant_batch" className="text">
                            Batch
                        </label>
                        <InputText className="textbox" id="dopant_batch" value={product.dopant_batch} onChange={(e) => onInputChange(e, 'dopant_batch')}  />
                    </div>
                    <div className="container">
                        <label htmlFor="dopant_company" className="text">
                            Company
                        </label>
                        <InputText className="textbox" id="dopant_company" value={product.dopant_company} onChange={(e) => onInputChange(e, 'dopant_company')}  />
                    </div>
                </div>
                <div className="font-bold underline">
                    Loading Info:
                </div>
                <div className="container">
                    <div className="container">
                        <label htmlFor="loading_polymer" className="text">
                            Polymer amount
                        </label>
                        <InputText className="textbox" id="loading_polymer" value={product.loading_polymer} onChange={(e) => onInputChange(e, 'loading_polymer')}  />
                    </div>
                    <div className="container">
                        <label htmlFor="loading_dopant" className="text">
                            Dopant amount
                        </label>
                        <InputText className="textbox" id="loading_dopant" value={product.loading_dopant} onChange={(e) => onInputChange(e, 'loading_dopant')}  />
                    </div>
                </div>
                <div className="container">
                    <div className="container">
                        <label htmlFor="loading_solvent" className="text">
                            Solvent / Co-solvent mic ect
                        </label>
                        <InputText className="textbox" id="loading_solvent" value={product.loading_solvent} onChange={(e) => onInputChange(e, 'loading_solvent')}  />
                    </div>
                    <div className="container">
                        <label htmlFor="temperature" className="text">
                            Temperature (C):
                        </label>
                        <InputText className="textbox" id="temperature" value={product.temperature} onChange={(e) => onInputChange(e, 'temperature')}  />
                    </div>
                </div>
                <div className="font-bold underline">
                    Print Info:
                </div>
                <div className="container">
                    <div className="container">
                        <label htmlFor="print_speed" className="text">
                            Print Speed
                        </label>
                        <InputText className="textbox" id="print_speed" value={product.print_speed} onChange={(e) => onInputChange(e, 'print_speed')}  />
                    </div>
                    <div className="container">
                        <label htmlFor="print_voltage" className="text">
                            Print Voltage
                        </label>
                        <InputText className="textbox" id="print_voltage" value={product.print_voltage} onChange={(e) => onInputChange(e, 'print_voltage')}  />
                    </div>
                    <div className="container">
                        <label htmlFor="print_head_diameter" className="text">
                            Print Head diameter
                        </label>
                        <InputText className="textbox" id="print_head_diameter" value={product.print_head_diameter} onChange={(e) => onInputChange(e, 'print_head_diameter')}  />
                    </div>
                </div>

                <div className="font-bold underline">
                    Exposure Info:
                </div>
                <div className="container">
                    <div className="container">
                        <label htmlFor="exposure_time" className="text">
                            Exposure Time
                        </label>
                        <InputText className="textbox" id="exposure_time" value={product.exposure_time} onChange={(e) => onInputChange(e, 'exposure_time')}  />
                    </div>
                </div>

                {/* <div className="font-bold underline">
                    Doping Technique Info:
                </div>
                <div className="container">
                    <Accordion activeIndex={0}>
                        <AccordionTab header="Drip">
                            <div className="container">
                                <label htmlFor="solvent_drip" className="text">
                                    Solvent
                                </label>
                                <InputText className="textbox" id="solvent_drip" value={product.print_speed} onChange={(e) => onInputChange(e, 'solvent_drip')}  />
                                <label htmlFor="volume_drip" className="text">
                                    Volume
                                </label>
                                <InputText className="textbox" id="volume_drip" value={product.print_voltage} onChange={(e) => onInputChange(e, 'volume_drip')}  />
                                <label htmlFor="time_drip" className="text">
                                    Time
                                </label>
                                <InputText className="textbox" id="time_drip" value={product.print_head_diameter} onChange={(e) => onInputChange(e, 'time_drip')}  />
                                <label htmlFor="conc_drip" className="text">
                                    Concentration
                                </label>
                                <InputText className="textbox" id="conc_drip" value={product.print_head_diameter} onChange={(e) => onInputChange(e, 'conc_drip')}  />
                            </div>
                        </AccordionTab>
                        <AccordionTab header="Dip">
                            <div className="container">
                                <label htmlFor="solvent_dip" className="text">
                                    Solvent
                                </label>
                                <InputText className="textbox" id="solvent_dip" value={product.print_speed} onChange={(e) => onInputChange(e, 'solvent_dip')}  />
                                <label htmlFor="time_dip" className="text">
                                    Time
                                </label>
                                <InputText className="textbox" id="time_dip" value={product.print_head_diameter} onChange={(e) => onInputChange(e, 'time_dip')}  />
                                <label htmlFor="conc_dip" className="text">
                                    Concentration
                                </label>
                                <InputText className="textbox" id="conc_dip" value={product.print_head_diameter} onChange={(e) => onInputChange(e, 'conc_dip')}  />
                            </div>
                        </AccordionTab>
                        <AccordionTab header="Blend">
                            <div className="container">
                                <label htmlFor="solvent_blend" className="text">
                                    Solvent
                                </label>
                                <InputText className="textbox" id="solvent_blend" value={product.print_speed} onChange={(e) => onInputChange(e, 'solvent_blend')}  />
                                <label htmlFor="mol_blend" className="text">
                                    Mol%
                                </label>
                                <InputText className="textbox" id="mol_blend" value={product.print_head_diameter} onChange={(e) => onInputChange(e, 'mol_blend')}  />

                            </div>
                        </AccordionTab>
                    </Accordion>
                </div> */}

                <div className="font-bold underline">
                    Substrate Info:
                </div>
                <div className="container">
                    <div className="container">
                        <label htmlFor="substrate_name" className="text">
                            Name
                        </label>
                        <InputText className="textbox" id="substrate_name" value={product.substrate_name} onChange={(e) => onInputChange(e, 'substrate_name')}  />
                    </div>
                    <div className="container">
                        <label htmlFor="substrate_company" className="text">
                            Company
                        </label>
                        <InputText className="textbox" id="substrate_company" value={product.substrate_company} onChange={(e) => onInputChange(e, 'substrate_company')}  />
                    </div>
                </div>
                <div className="font-bold underline">
                    Annealing Info:
                </div>
                <div className="container">
                    <div className="container">
                        <label htmlFor="annealing_temperature" className="text">
                            Temperature (C) :
                        </label>
                        <InputText className= "textbox" id="annealing_temperature" value={product.annealing_temperature} onChange={(e) => onInputChange(e, 'annealing_temperature')}  />
                    </div>
                    <div className="container">
                        <label htmlFor="annealing_duration" className="text">
                            Duration (mins) :
                        </label>
                        <InputText className="textbox" id="annealing_duration" value={product.annealing_duration} onChange={(e) => onInputChange(e, 'annealing_duration')}  />
                    </div>
                </div>
                <div className="font-bold underline">
                    Fab environment :
                </div>
                <div className="container">
                    <div className="container">
                        <label htmlFor="fab_box" className="text">
                            Air/ glove box
                        </label>
                        <InputText className="textbox" id="fab_box" value={product.fab_box} onChange={(e) => onInputChange(e, 'fab_box')}  />
                    </div>
                    <div className="container">
                        <label htmlFor="fab_humidity" className="text">
                            Humidity
                        </label>
                        <InputText className="textbox" id="fab_humidity" value={product.fab_humidity} onChange={(e) => onInputChange(e, 'fab_humidity')}  />
                    </div>
                </div>
            </Dialog>
        </div>
    );
}