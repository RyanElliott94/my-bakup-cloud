import React from "react";
import Header from "./Header";
import Login from "./Login";

export default class Home extends React.Component{
    constructor(props){
        super(props);
    }

    render(){
        return (
            <div className="container">
               <Login />
            </div>
        );
    }
}