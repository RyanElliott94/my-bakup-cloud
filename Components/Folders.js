import React from "react";
import { Link, Route } from "react-router-dom";
import { FaFolder } from 'react-icons/fa';
import { AiFillFolderAdd } from "react-icons/ai";
import { FiLogOut } from "react-icons/fi";
import * as firebase from 'firebase/app';
import { ContextMenu, MenuItem, ContextMenuTrigger } from "react-contextmenu";
import { saveAs } from "file-saver";
import Popup from "./Popup";
require("firebase/database");
require("bootstrap/js/src");
require("firebase/storage");
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

        this.state.databaseRef.on("child_removed", (data) => {
            $(`#${data.key}`).remove();
        });

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

        updateFolder = (key, values) => {
            this.state.databaseRef.once("value", snap => {
                snap.forEach(data => {
                    if(data.key === key){
                        this.state.databaseRef.update(values);
                    }
                })
            });
        }

        
    getFolders = () => {
        this.state.databaseRef.on('child_added', data => {
            if(data.val().ownerID === this.state.userID){
                this.finalFolderList.push({
                    folderID: data.key,
                    storagePath: data.val().storagePath,
                    folderName: data.val().folderName,
                    ownerID: data.val().ownerID
                });
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

    handleMenu = (e, data, target) => {
        switch(data.menuItem){
        case "item-0":
            e.preventDefault();
            var key = $(target).find(".folder-item").attr("id");
            
            // this.finalFolderList.forEach(item => {
            //     if(item.folderName === id){
            //         console.log(item.storagePath)
            //     }
            // });
            break;
        case "item-1":
            var id = $(target).find(".folder-item").attr("id");
            this.state.databaseRef.once("value", snap => {
                snap.forEach(data => {
                    if(data.key === id){
                        var listData = firebase.storage().ref(`${data.val().storagePath}/`).listAll();
                        listData.then(listData => {
                            listData.items.forEach(img => {
                             img.getDownloadURL().then(src => {
                                 var xhr = new XMLHttpRequest();
                                 xhr.responseType = 'blob';
                                 xhr.onload = function(event) {
                                     var blob = xhr.response;
                                     saveAs(blob, img.name);
                                 };
                                 xhr.open('GET', src);
                                 xhr.send();
                               });
                            });
                        });
                    }
                });
            });
            break;
        case "item-2":
            var id = $(target).find(".folder-item").attr("id");
            this.state.databaseRef.child(id).remove().then(() => {
                this.state.databaseRef.child(id).once("value", snap => {
                    snap.forEach(data => {
                        firebase.storage().ref(data.val().storagePath).delete();
                    });
                });
            });
            break;
        }
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

                return <Link className="f-items" key={i} to={{ 
                    pathname: '/gallery', 
                    state: {
                        storagePath: items.storagePath,
                        folderName: items.folderName,
                        loadImages: true
                    } 
                }}>

                    <ContextMenuTrigger id="menu">
                    <p className="folder-item" id={items.folderID}><FaFolder className="folder-icon" color="#5f9ea0" />{items.folderName}</p>
                    </ContextMenuTrigger>
                    </Link>
            }) : clearInterval(this.loadFolders)}
                </div>
                <Popup show={false} />
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
            <MenuItem data={{menuItem: 'item-0'}} onClick={this.handleMenu}>
            Edit Folder
            </MenuItem>
            <MenuItem data={{menuItem: 'item-1'}} onClick={this.handleMenu}>
            Download All Files
            </MenuItem>
            <MenuItem data={{menuItem: 'item-2'}} onClick={this.handleMenu}>
            Delete Folder
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