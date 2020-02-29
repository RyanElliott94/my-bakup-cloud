import React from "react";
const $ = require("jquery");

export default class Popup extends React.Component {
    constructor(props){
        super(props);

        this.state = {
            show: props.show
        }
    }

    componentDidMount(){
        this.getModal() 
    }

    getModal = () => this.state.show ? $(".modal").modal("show") : false;

    render(){
        return <div className="modal" tabIndex="-1" role="dialog">
        <div className="modal-dialog" role="document">
            <div className="modal-content">
            <div className="modal-header">
                <h5 className="modal-title">Create/Edit a folder</h5>
                <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                <span aria-hidden="true">&times;</span>
                </button>
            </div>
            <div className="modal-body">
                <label htmlFor="main-folder-name">Folder Name</label>
                <input className="form-control" type="text" id="main-folder-name"></input>
            </div>
            <div className="modal-footer">
                <button type="button" className="btn btn-secondary" data-dismiss="modal">Close</button>
                <button type="button" className="btn btn-primary" >Finish</button>
            </div>
            </div>
        </div>
        </div>
    }
}