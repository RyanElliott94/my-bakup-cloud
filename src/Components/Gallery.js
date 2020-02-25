import React from "react";
import * as firebase from 'firebase';
require("firebase/database");
require("firebase/storage");
require("firebase/auth");
const $ = require("jquery");

export default class Gallery extends React.Component{
    constructor(props){
        super(props)

        this.state = {
            imageRef: firebase.storage().ref("uploadedImages/")
        }

    }

    componentDidMount(){

        var fileList = [];

        $("#add-photo").on("click", () => {
            $(".new-photo-input").focus().trigger('click');
            $(".new-photo-input").on('change',(evt) => {
                for(var i = 0; i < evt.target.files.length; i++){
                    fileList.push(evt.target.files[i]);
                }
                fileList.forEach(image => {
                    this.uploadPhoto(image, image.type);
                });
            });
        });

    }

    componentWillMount(){
        this.pageTokenExample();
    }

    async pageTokenExample(){
        var listRef = firebase.storage().ref("uploadedImages/");

        var firstPage = await listRef.list({ maxResults: 50});
        firstPage.items.forEach(image => {
            image.getDownloadURL().then(url => {
                $(".image-content").find(".col").append(`<img src=${url}></img>`);
            });
        });

        $(window).scroll(async function() {
            if($(window).scrollTop() + $(window).height() == $(document).height() && firstPage.nextPageToken) {
                    var secondPage = await listRef.list({maxResults: 15, pageToken: firstPage.nextPageToken});
                    for(var i = 0; i < secondPage.items.length; i++){
                        secondPage.items[i].getDownloadURL().then(url => {
                            $(".image-content").find(".col").append(`<img src=${url}></img>`);
                        });
                    }
                }
            });
        }

        addImagesToGrid(url){
            $(".image-content").find(".col").append(`<img src=${url}></img>`);
        }

    uploadPhoto(file, meta) {
        const metadata = {
            contentType: meta
        };

        let upload = this.state.imageRef.child(`img-${Math.random()}`).put(file, metadata);
        upload.on(firebase.storage.TaskEvent.STATE_CHANGED,
            (snapshot) => {
                let progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                $(".progress-bar").css({display:"flex"});
                $(".progress-bar").width(Math.round(progress) + "%");
                $(".progress-bar").text(Math.round(progress) + "%");
            },
            (error) => {
                switch (error.code) {
                    case 'storage/unauthorized':
                        break;
                    case 'storage/unknown':
                        break;
                }
            }, () => {
                upload.snapshot.ref.getDownloadURL().then((downloadURL) => {
                    $(".progress-bar").css({display:"none"});
                });
            });
    }

    render(){
        return (
            <div className="gal-content">
                <section className="top-section">
                <button className="btn btn-sm" id="add-photo">Add more photo's</button>
                <input type="file" name="file" accept="image/*" id="add-photo" className="new-photo-input" style={{display:"none"}} multiple></input>
                </section>
                <div className="progress">
                <div className="progress-bar" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" style={{display:"none"}}></div>
                </div>
                <hr/>
                <section className="image-content">
                        <div className="col"></div>
                </section>
            </div>
        );
    }
}