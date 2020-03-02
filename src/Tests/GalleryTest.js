import React from "react";
import * as firebase from 'firebase';
import { PhotoSwipe } from "react-photoswipe";
import LazyLoad from "react-lazyload";
import { FaFileVideo } from 'react-icons/fa';
import { MdAddCircle } from 'react-icons/md';
import { AiFillHome } from "react-icons/ai";
import { ContextMenu, MenuItem, ContextMenuTrigger } from "react-contextmenu";
import { saveAs } from "file-saver";
import ReactPaginate from 'react-paginate';
const Jimp = require('jimp');
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
            fullSizeImages: [],
            originalListData: [],
            hasLoaded: false,
            noImages: false,
            showImage: false
        }

    this.modifiedListData = [];
    this.newImagesList = [];
    this.numberPerPage = 25;
    this.currentPage = 1;
    this.slicedFullSizeImages =[];
    this.numberOfPages = 0;
    this.imgData = [];
    this.isOpen = false;
    this.imgsForSwipe = [];
    this.fullSizeImageList = [];
    this.fullSizeIMGs = [];
    this.mq = window.matchMedia("(max-width: 480px)");
    }

    componentWillMount(){
        this.addItemsToArray();
    }

    componentDidMount() {

        this.loadImages = setInterval(() => {
                this.loadList();
        }, 3000);

        $(document).on("contextmenu", e => {
            e.preventDefault();
        });

        // $(".next").on("click", e => {
        // this.currentPage += 1;
        // this.loadList();
        // });

        // $(".previous").on("click", e => {
        // this.currentPage = - 1;
        // this.loadList();
        // });

    }

    convertCurrentFiles = () => {
        var fileList = firebase.storage().ref("/twitter").listAll();

        fileList.then(data => {
            data.items.forEach(item => {
                item.getDownloadURL().then(url => {
                    Jimp.read(url)
                    .then(data => {
                    return data
                        .resize(512, Jimp.AUTO)
                        .getBase64(Jimp.AUTO, (err, src) => {
                            this.uploadThumbnails(src, item.name);
                        });
                    })
                    .catch(err => {
                    console.error(err);
                    });
                });
            });
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
                this.uploadPhoto(evt.target.files[i], {
                    contentType: fileType,
                    name: fileName,
                    size: fileSize,
                    updated: updated
                }, fileType.includes("image") ? "" : fileType.includes("video") ? "video" : "thumbnail", fileName);
            }
        });
    }

    uploadPhoto(file, meta, type) {
        var fileType = "";
        let progress = 0;
        const metadata = {
            meta
        };
        if(type === "video"){
            fileType = this.state.videoRef.child(file.name).put(file, meta);
        }else{
            fileType = this.state.imageRef.child(file.name).put(file, meta);
        }

        let upload = fileType;
        upload.on(firebase.storage.TaskEvent.STATE_CHANGED,
            (snapshot) => {
                progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                $(".progress-bar").css({display:"block"});
                $(".progress-bar").width(Math.round(progress) + "%");
                $(".progress-bar").text(`Uploading File.... %${Math.round(progress)}`);
            },
            (error) => {
                switch (error.code) {
                    case 'storage/unauthorized':
                        break;
                    case 'storage/unknown':
                        break;
                    default: 
                    break;    
                }
            }, () => {
                upload.snapshot.ref.getDownloadURL().then((downloadURL) => {
                    console.log(upload);
                    if(type === ""){
                    $(".progress-bar").text(`Generating Thumbnails... %${Math.round(progress)}`);
                    Jimp.read(downloadURL)
                    .then(data => {
                    return data
                        .resize(512, Jimp.AUTO)
                        .getBase64(Jimp.AUTO, (err, src) => {
                            this.uploadThumbnails(src, file.name);
                        });
                    })
                    .catch(err => {
                    console.error(err);
                    });
                    }
                });
            });
    }
    
    uploadThumbnails = (file, fileName) => {
        var upload = this.state.thumbRef.child(fileName).putString(file, 'data_url', {contentType: "image/jpg"});
        console.log(upload)
        upload.on(firebase.storage.TaskEvent.STATE_CHANGED,
            (snapshot) => {
                let progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                $(".progress-bar").css({display:"block"});
                $(".progress-bar").width(Math.round(progress) + "%");
                $(".progress-bar").text(`Uploading Thumbnails... %${Math.round(progress)}`)
                console.log("%", Math.round(progress));
            },
            (error) => {
                switch (error.code) {
                    case 'storage/unauthorized':
                        break;
                    case 'storage/unknown':
                        break;
                    default: 
                    break;    
                }
            }, () => {
                $(".progress-bar").css({display:"none"});
            }
            );
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

         return;
      }

      getFullSizeImages = () => {
          this.slicedFullSizeImages.forEach(item => {
                item.getDownloadURL().then(url => {
                    this.fullSizeImageList.push(
                        {
                            fileName: item.name,
                            src: url
                        }
                    );
                 });
          });

      }

      handleMenu = (e, data, target) => {
          switch(data.menuItem){
            case "item-1":
                var fileName = $(target).find(".image-item").attr("id");
                this.state.fullSizeImages.forEach(img => {
              if(img.name === fileName){
                    img.getDownloadURL().then(src => {
                        var xhr = new XMLHttpRequest();
                        xhr.responseType = 'blob';
                        xhr.onload = function(event) {
                            var blob = xhr.response;
                            saveAs(blob, fileName);
                        };
                        xhr.open('GET', src);
                        xhr.send();
                      });
              }
          });
              break;
            case "item-2":
                var fileName = $(target).find(".image-item").attr("id");
                this.state.imageRef.child(fileName).delete().then(() => {
                    this.state.thumbRef.child(fileName).delete();
                }).catch(error => {
                    console.log(error)
                });
              break;
          }
      }

      showImage = (e, data, target) => {
          var fileName = $(e.target).closest(".image-item").attr("id");
          var contextFileName = $(target).find(".image-item").attr("id");
          var id = data.menuItem === "item-0" ? contextFileName : fileName;

            this.state.fullSizeImages.forEach(img => {
                if(img.name === id){
                    img.getDownloadURL().then(src => {
                        window.open(src)
                    });
                }
            });
      }


      getNumberOfPages() {
        return Math.ceil(this.imgData.length / this.numberPerPage);
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
        $(".next").attr("disabled", this.currentPage === this.numberOfPages ? true : false);
        $(".prev").attr("disabled", this.currentPage === 1 ? true : false);
        $(".first").attr("disabled", this.currentPage === 1 ? true : false);
        $(".last").attr("disabled", this.currentPage === this.numberOfPages ? true : false);
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
                <div className="progress-bar" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" ></div>
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
                    return <ContextMenuTrigger id="menu" holdToDisplay={500}>
                    <LazyLoad height={5}>
                        {item.src.fileType.includes("video") ?
                        <a href={item.src}>
                        <FaFileVideo className="folder-icon img-thumbnail" color="#5f9ea0"/> 
                        </a>
                        :
                          <img className="img image-item" key={i} id={item.src.fileName} onClick={this.showImage} src={item.src.thumbnail} download={item.src.thumbnail}></img>
                        }
                    </LazyLoad>
                    </ContextMenuTrigger>
                        }) : ""}
                        {this.imgData.map((item, i) => {
                        return item.src.fileType.includes("video") ?
                        <LazyLoad>
                        <a href={item.src}>
                        <FaFileVideo className="video-file-icon" color="#5f9ea0"/> 
                        </a>
                        </LazyLoad>
                         : null
                    })}
                    </div>
                    {this.state.noImages ? this.noImages() : null}
                    </div>
                <div className="controls">
                {/* <ReactPaginate
                    previousLabel={'previous'}
                    nextLabel={'next'}
                    breakLabel={'...'}
                    breakClassName={'break-me'}
                    pageCount={this.getNumberOfPages}
                    marginPagesDisplayed={2}
                    pageRangeDisplayed={5}
                    onPageChange={this.loadList}
                    containerClassName={'pagination'}
                    subContainerClassName={'pages pagination'}
                    activeClassName={'active'}
                /> */}

                <button className="btn btn-sm prev">Prev</button>
                <button className="btn btn-sm next"value="next">Next</button>
                </div>
                </section>
            </div>

            <ContextMenu id="menu">
            <MenuItem data={{menuItem: 'item-0'}} onClick={this.showImage}>
            View image in a new tab
            </MenuItem>
            <MenuItem data={{menuItem: 'item-1'}} onClick={this.handleMenu}>
            Download File
            </MenuItem>
            <MenuItem data={{menuItem: 'item-2'}} onClick={this.handleMenu}>
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
