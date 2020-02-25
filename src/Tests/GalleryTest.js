import React from "react";
import * as firebase from 'firebase';
import { PhotoSwipe } from "react-photoswipe";
import LazyLoad from "react-lazyload";
import { FaFileVideo } from 'react-icons/fa';
import { MdAddCircle } from 'react-icons/md';
import { AiFillHome } from "react-icons/ai";
import { ContextMenu, MenuItem, ContextMenuTrigger } from "react-contextmenu";
const Jimp  = require('jimp');
require("firebase/database");
require("firebase/storage");
require("firebase/auth");
const $ = require("jquery");

export default class GalleryTest extends React.Component{
    constructor(props){
        super(props)
        this.state = {
            videoRef: firebase.storage().ref(`${props.location.state.storagePath}/videos`),
            imageRef: firebase.storage().ref(`${props.location.state.storagePath}/`),
            thumbRef: firebase.storage().ref(`${props.location.state.storagePath}/thumbs`),
            originalListData: [],
            hasLoaded: false,
            noImages: false,
            showImage: false
        }
        
    this.modifiedListData = [];
    this.newImagesList = [];
    this.numberPerPage = 50;
    this.currentPage = 1;
    this.numberOfPages = 0;
    this.imgData = [];
    this.isOpen = false;
    this.imgsForSwipe = [];
    this.fullSizeImageList = [];
    this.fullSizeIMGs = [];
    this.preEditImages = [];
    this.mq = window.matchMedia("(max-width: 480px)");
    }

    componentWillMount(){
        this.addItemsToArray();
    }

    componentDidMount() {

        this.loadImages = setInterval(() => {
                this.loadList();
        }, 2000);

        $(".next").on("click", e => {
        this.currentPage += 1;
        this.loadList();
        });

        $(".prev").on("click", e => {
        this.currentPage = - 1;
        this.loadList();
        });

    }

    addNewFile = () => {
        $(".new-photo-input").focus().trigger('click');
        $(".new-photo-input").on('change', (evt) => {
            for(var i = 0; i < evt.target.files.length; i++){
                var fileType = evt.target.files[i].type;
                var fileName = evt.target.files[i].name;
                var fileSize = evt.target.files[i].size;
                var updated = evt.target.files[i].lastModified;
                console.log(fileName)
                this.uploadPhoto(evt.target.files[i], {
                    contentType: fileType,
                    name: fileName,
                    size: fileSize,
                    updated: updated
                }, fileType.includes("image") ? "" : fileType.includes("video") ? "video" : "thumbnail", fileName);
            }
        });
    }

    uploadPhoto(file, meta, type, fileName) {
        var fileType = this.state.imageRef.child(file.name).put(file, meta);
        if(type === "thumbnail"){
            fileType = this.state.thumbRef.child(fileName).putString(file, 'data_url');
        }else if(type === "video"){
            fileType = this.state.videoRef.child(file.name).put(file, meta);
        }else {
            fileType = this.state.imageRef.child(file.name).put(file, meta);
        }
        const metadata = {
            meta
        };

        let upload = fileType;
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
                    this.preEditImages.push({
                        imageName: fileName,
                        src: downloadURL
                    });
                }).finally(() => {
                    this.createThumbnails()
                });
            });

    }
    

    viewImage = event => {
        const index = $(event.target).attr("id");
        return <PhotoSwipe
        isOpen={this.isOpen = true} 
        items={this.imgData} 
        options={{index: parseInt(index), h: 3000, w: 3000}} 
        onClose={this.handleClose()}
        />
    }

    createThumbnails = () => {
        this.preEditImages.forEach(img => {
            Jimp.read(img.src)
            .then(lenna => {
              return lenna
                .resize(512, Jimp.AUTO)
                .getBase64(Jimp.AUTO, (err, src) => {
                    console.log(src);
                    // this.uploadPhoto(img.src, "", "thumbnail", img.imageName);
                });
            })
            .catch(err => {
              console.error(err);
            });
        });

        // DOWNLOAD AND INSTALL A IMAGE RESIZER NPM PACKAGE

        // IMPORT SAID PACKAGE

        // USE THE PACKAGE TO RESIZE THE IMAGE BEFORE OUTPUTTING THE FILE INTO A NEW ARRAY

        // THEN PASS EACH RESIZED IMAGE THROUGHT uploadPhoto()
    }

    handleClose = () => {
        this.isOpen = false;
    }

    async addItemsToArray(){
        var fullSizedImages = await this.state.imageRef.listAll();
        var thumbs = await this.state.thumbRef.listAll();
            this.setState({
                thumbs: thumbs.items,
                fullSizeImages: fullSizedImages.items
            });
        this.numberOfPages = this.getNumberOfPages()
    }
    
      loadList = () => {
          $("img").remove();
         var begin = ((this.currentPage - 1) * this.numberPerPage);
    
         var end = begin + this.numberPerPage;

         this.modifiedListData = this.state.thumbs.slice(begin, end);
         this.slicedFullSizeImages = this.state.fullSizeImages.slice(begin, end);

         this.modifiedListData.map((item, i) => {
                item.getDownloadURL().then(url => {
                item.getMetadata().then(data => {
                    this.imgData.push({
                        index: i,
                        src: {
                            fileName: item.name,
                            thumbnail: url,
                            fileType: data.contentType
                        }
                        });
                    });
                });
            });
            this.getFullSizeImages()
         this.drawList();
      }

      getFullSizeImages = () => {
          this.slicedFullSizeImages.map((item, i) => {
              item.getMetadata().then(data => {
                item.getDownloadURL().then(url => {
                    this.fullSizeImageList.push(
                        {
                            fileName: item.name,
                            fileType: data.contentType,
                            src: url
                        }
                    );
                 });
              });
          });
      }

      showImage = (e) => {
          var fileName = $(e.target).attr("id");
              var slicedName = fileName.split("_512x512").join("");
             this.fullSizeImageList.forEach(img => {
                 if(img.fileName === slicedName){
                     window.open(img.src)
                 }
             });
      }
    
    //   () => {
    //     var link = url.split("_512x512");
    //     // .join(`token=${getToken}`)
    //     link.map((img, i) => {
    //         link.shift(i);
    //         // img.join(`token=${getToken}`)
    //     });
    //     link.forEach(item => {
    //         console.log(item)
    //     });
    //     return getToken + link;
    // }

      getNumberOfPages() {
        return Math.ceil(this.state.thumbs.length / this.numberPerPage);
    }

    

    drawList = () => {
        if(this.state.thumbs.length){
            this.setState({
                hasLoaded: true
            });
    
            // this.imgData.forEach(img => {
            //     this.imgsForSwipe.push(
            //         {
            //             src: img.src,
            //             h: 3000,
            //             w: 3000
            //         })
            // });

            this.check();
        }else{
            this.setState({noImages: true})
        }
    }

    check() {
        $(".next").attr("disabled", this.currentPage == this.numberOfPages ? true : false);
        $(".prev").attr("disabled", this.currentPage == 1 ? true : false);
        $(".first").attr("disabled", this.currentPage == 1 ? true : false);
        $(".last").attr("disabled", this.currentPage == this.numberOfPages ? true : false);
    }


    noImages(){
        $(".load-spin").css({display: "none"});
        $(".loading-text").text("");
        clearInterval(this.loadImages)
        return this.imgData.length === 0 ? <p>No Images Were Found!</p> : ""
    }

    // getImageItems(){
    //     var imgUrl = "";
    //     var index = 0;
    //     for(var i = 0; i < this.modifiedListData.length; i++){
    //         this.modifiedListData[i].getDownloadURL().then(url => {
    //             index = i;
    //             imgUrl = url;
    //         });
    //     }
    //     return <LazyLoad 
    //     height="200" 
    //     offset={100} 
    //     resize={true} 
    //     once={true}>
    //   <a href={url}>
    //   <img
    //     className="image-item"
    //     id={index} 
    //     key={i} 
    //     src={im}
    //     onClick={this.viewImage}
    //     ></img>
    //   </a>
    //     </LazyLoad>
    // }


    render(){
        return (
            <div>
                <section className="top-section">
                <div className="options">
                <p className="folder-name">{this.props.location.state.folderName}</p>
                {this.mq.matches ? <a className="home-ico" href="/"><AiFillHome color="white" /></a> : <a className="home-link" href="/">Home</a>}
                {this.mq.matches ? <MdAddCircle className="add-photo-ico" color="white" onClick={this.addNewFile} /> : <button className="btn btn-sm" onClick={this.addNewFile} id="add-photo">Add more photo's</button>}
                </div>
                <input type="file" name="file" accept="image/*, video/*" id="add-photo" className="new-photo-input" style={{display:"none"}} multiple></input>
                </section>
            <div className="gal-content">
                <div className="progress">
                <div className="progress-bar" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" style={{display:"none"}}></div>
                </div>
                <section className="image-content">
                <div className="col">
                <div className="spinner-border text-info load-spin" role="status">
                <span className="sr-only">Loading...</span>
                </div>
                <p className="loading-text">Loading...</p>
                <div className="image-grid">
                {this.state.hasLoaded ? this.imgData.map((item, i) => {
                    $(".load-spin").css({display: "none"})
                    $(".loading-text").text("");
                    clearInterval(this.loadImages);
                    return <ContextMenuTrigger id="menu">
                    <LazyLoad height={5}>
                        {item.src.fileType.includes("video") ?
                        <a href={item.src}>
                        <FaFileVideo className="folder-icon img-thumbnail" color="#5f9ea0"/> 
                        </a>
                        :
                          <img className="img image-item" key={i} id={item.src.fileName} onClick={this.showImage} src={item.src.thumbnail}></img>
                        }
                    </LazyLoad>
                    </ContextMenuTrigger>
                        }) : this.state.noImages ? this.noImages() : null}
                        {this.fullSizeImageList.map((item, i) => {
                        return item.fileType.includes("video") ?
                        <LazyLoad>
                        <a href={item.src}>
                        <FaFileVideo className="video-file-icon" color="#5f9ea0"/> 
                        </a>
                        </LazyLoad>
                         : null
                    })}
                    </div>
                    </div>
                <div className="controls">
                <button className="btn btn-sm prev">Prev</button>
                <button className="btn btn-sm next"value="next">Next</button>
                </div>
                </section>
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
        );
    }
}

// render() {
//     const noteItems = this.state.notes.map((note) =>
//       <li>{note}</li>
//     );
//     return (
//       <ul>{noteItems}</ul>
//     );
//   }
// }

// {this.imagesList.map((img, i) => <img key={i} src={img}></img>)}
