import React from "react";
import { Link, Route } from "react-router-dom";
import { FaFolder } from 'react-icons/fa';
import { AiFillFolderAdd } from "react-icons/ai";
import { FiLogOut } from "react-icons/fi";
import * as firebase from 'firebase/app';
import { ContextMenu, MenuItem, ContextMenuTrigger } from "react-contextmenu";
require("firebase/database");
require("bootstrap/js/src");
const $ = require("jquery");

export default class Folders extends React.Component{
    constructor(props){
        super(props)

        this.state = {
            userID: props.currentUser.uid,
            databaseRef: firebase.database().ref('folders/'),
            folderList: [],
            folderName: "",
            storageFolderName: ""
        }

        this.finalFolderList = [];
        this.mq = window.matchMedia("(max-width: 480px)");
    }

    componentWillMount() {
        this.getFolders();
    }

    componentDidMount(){
        this.loadFolders = setInterval(() => {
            this.loadList();
        }, 1500);

    }

    createFolder = () => {
        var folderName = $("#main-folder-name").val();
        this.state.databaseRef.push().set({
            storagePath: folderName.includes(" ") ? folderName.split(" ").join("-").toLowerCase() :  folderName.toLowerCase(),
            folderName: $("#main-folder-name").val(),
            ownerID: this.state.userID
          }, error => {
            if (error) {
              // The write failed...
            } else {
            }
          }).then(() => {
            $('.modal').modal('hide');
            // $(".f-items").remove();
            this.loadList()
          });
        }

        
    getFolders = () => {
        this.state.databaseRef.on('child_added', data => {
            if(data.val().ownerID === this.state.userID){
                this.finalFolderList.push(data);
            }
          });
    }

    loadList = () => {
        this.setState({
            folderList: this.finalFolderList
        });
    }

    logout = () => {
        firebase.auth().signOut().then(() => {
            window.location.pathname = "/";
        });
    }

    render(){
        return (
            <div>
            <section className="top-section">
                <div className="options">
            {this.mq.matches ? <AiFillFolderAdd className="new-folder-ico" color="white" onClick={() => $('.modal').modal('show')} /> : <button className="btn btn-sm create-folder" onClick={() => $('.modal').modal('show')}>Create a folder</button>}
            {this.mq.matches ? <FiLogOut className="logout-ico" color="white" onClick={this.logout} /> : <button className="btn btn-sm logout" onClick={this.logout}>Log Out</button>}
                </div>
            </section>
            <div className="folder-layout" >
            <div class="d-flex justify-content-center pt-3">
            <div class="spinner-border load-spin" role="status">
                <span class="sr-only">Loading...</span>
            </div>
            </div>
            <p className="loading-text">Loading Folders...</p>
                <div className="folders">
            {this.state.folderList.length ? this.state.folderList.map((items, i) => {
                clearInterval(this.loadFolders);
                $(".load-spin").css({display: "none"})
                $(".loading-text").text("");
                console.log(this.state.userID);
                return <Link className="f-items" key={i} to={{ 
                    pathname: '/gallery', 
                    state: {
                        storagePath: items.val().storagePath,
                        folderName: items.val().folderName,
                        loadImages: true
                    } 
                }}>
                    <ContextMenuTrigger id="menu">
                    <p className="folder-item"><FaFolder className="folder-icon" color="#5f9ea0" />{items.val().folderName}</p>
                    </ContextMenuTrigger>
                    </Link>
            }) : clearInterval(this.loadFolders)}
                </div>
                <div className="modal" tabIndex="-1" role="dialog">
            <div className="modal-dialog" role="document">
                <div className="modal-content">
                <div className="modal-header">
                    <h5 className="modal-title">Create a new folder</h5>
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
                    <button type="button" className="btn btn-primary" onClick={this.createFolder}>Create Folder</button>
                </div>
                </div>
            </div>
            </div>
            </div>

            <ContextMenu id="menu">
            <MenuItem data={{menuItem_0: 'item 0'}} onClick={this.handleClick}>
            View image in a new tab
            </MenuItem>
            <MenuItem data={{menuItem_1: 'item 1'}} onClick={this.handleClick}>
            Download File
            </MenuItem>
            <MenuItem data={{menuItem_2: 'item 2'}} onClick={this.handleClick}>
            Delete this file
            </MenuItem>
            </ContextMenu>

            </div>
        )
    }
}

// TODO
// Fix the array of folders
// Stop multiple folders showing when being added to view


// NOTES
// Once that works, when clicking button i need to pass the folder name and storage folder name throught to gallery as a prop

// window.history.pushState("", "Title", "/gallery")