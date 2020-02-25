import React from "react";
import {PhotoSwipe} from 'react-photoswipe';

export default class ImageView extends React.Component {
    constructor(props){
        super(props);

        this.state = {
            imageOptions: {
                index: props.index,
                escKey: true,
                isOpen: this.props.view
            }
        }
    }

    handleClose = () => {
        this.setState({isOpen: false});
      };

    render(){
        return (<PhotoSwipe
                isOpen={this.state.isOpen} 
                items={this.props.images} 
                options={this.state.imageOptions} 
                onClose={this.handleClose}
                />)
    }
}