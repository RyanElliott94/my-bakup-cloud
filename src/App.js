import React from 'react';
import {BrowserRouter, Route} from 'react-router-dom';
import Home from './Components/Home';
import * as firebase from 'firebase/app';
import Gallery from './Components/Gallery';
import GalleryTest from './Tests/GalleryTest';
import Folders from './Components/Folders';

const ImageView = React.lazy(() => import("./Components/ImageView"))
require("firebase/auth");

export default class App extends React.Component{
  constructor(props){
    super();

    this.state = {
      user: null
    };


    var firebaseConfig = {
      apiKey: "AIzaSyBCPuCUA_bDwh3uwRDZwawIB7CE_7LiT9k",
      authDomain: "mybakupcloud.firebaseapp.com",
      databaseURL: "https://mybakupcloud.firebaseio.com",
      projectId: "mybakupcloud",
      storageBucket: "mybakupcloud.appspot.com",
      messagingSenderId: "94960637608",
      appId: "1:94960637608:web:cb47ef0d0cc01c0d1c149d"
    };
    
    firebase.initializeApp(firebaseConfig);

  }


  componentWillMount(){
    firebase.auth().onAuthStateChanged(user => {
      if (user) {
        this.setState({user});
      } else {
        this.setState({ user: null });
      }
    });
  }
   
  render(){
    return (
      <BrowserRouter>
          <Route exact={true} path='/' render={() => (
              this.state.user !=null ? <Folders currentUser={this.state.user} /> : <Home /> 
            )}/>
            <Route exact={false} path='/:handle' render={props => (
             <GalleryTest {...props} />
            )}/>
        </BrowserRouter>
    );
  }
}