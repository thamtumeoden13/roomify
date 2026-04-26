import React from 'react'
import {useLocation, useParams} from "react-router";

const VisualizerId = () => {
    const location = useLocation();
    const {initialImage, name} = location.state || {};
    return (

        // <div className="visualizer">
        //     <div className="topbar">
        //         <div className="brand">
        //             <span className="name">Roomify</span>
        //         </div>
        //     </div>
        //     <div className="content">
        //         <div className="panel">
        //             <div className="panel-header">
        //                 <div className="panel-meta">
        //                     <p>Project ID: {id}</p>
        //                     <h2>Visualizer</h2>
        //                 </div>
        //             </div>
        //             <div className="render-area">
        //                 {initialImage ? (
        //                     <img src={initialImage} alt="Uploaded floor plan" className="render-img"/>
        //                 ) : (
        //                     <div className="render-placeholder">
        //                         <p>No image data found.</p>
        //                     </div>
        //                 )}
        //             </div>
        //         </div>
        //     </div>
        // </div>
        <section>
            <h1>{name || "United Project"}</h1>
            <div className="visualizer">
                {initialImage && (
                    <div className="image-container">
                        <h2>Source Image</h2>
                        <img src={initialImage} alt="Uploaded floor plan" className=""/>
                    </div>
                )}
            </div>
        </section>
    )
}
export default VisualizerId
