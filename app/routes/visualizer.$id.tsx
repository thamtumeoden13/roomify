import React from 'react'
import {useLocation, useParams} from "react-router";

const VisualizerId = () => {
    const {id} = useParams();
    const location = useLocation();
    const image = location.state?.image;

    return (
        <div className="visualizer">
            <div className="topbar">
                <div className="brand">
                    <span className="name">Roomify</span>
                </div>
            </div>
            <div className="content">
                <div className="panel">
                    <div className="panel-header">
                        <div className="panel-meta">
                            <p>Project ID: {id}</p>
                            <h2>Visualizer</h2>
                        </div>
                    </div>
                    <div className="render-area">
                        {image ? (
                            <img src={image} alt="Uploaded floor plan" className="render-img"/>
                        ) : (
                            <div className="render-placeholder">
                                <p>No image data found.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
export default VisualizerId
