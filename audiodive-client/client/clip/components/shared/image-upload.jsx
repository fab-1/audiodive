import React from 'react';
import Modal from 'react-bootstrap/lib/Modal';
import Cropper from 'react-cropper';
import Loading from './loading.js';
import 'cropperjs/dist/cropper.css';
import axios from 'axios';


class ImageUpload extends React.Component {

    constructor() {
        super();
        this.state = {
            showDialog: false,
            saving:false
        };
    }

    show(type, message) {
        this.setState({
            type: type,
            message: message
        });
    }

    closeModal() {
        this.setState({
            showDialog: false
        });
    }

    cropImage() {

        this.setState({
            saving:true
        })

        this.crop.getCroppedCanvas({
            width:256,
            height:256,
            maxWidth: 256,
            maxHeight: 256
        }).
        toBlob((blob) => {

            var data = new FormData();
            data.append('imageData', blob);
            axios.post(`/admin/api/file/data_upload`, data).
            then(res => {
                this.props.onImageSaved(res.data.file);

                this.setState({
                    saving:false,
                    showDialog: false
                });
            });
        });

    }

    openCropTool() {

        this.setState({showDialog:true, saving: true});

        axios.post(`/admin/api/file/validate`, { url : this.props.sourceUrl }).
        then((res) => {
            this.props.onSourceImageChange(res.data.url);
            this.setState({saving: false})
        })
    }

    render(){

        return (
            <div className="margin-bottom">
                <Modal
                    className="modal-image-crop"
                    bsSize="small"
                    show={this.state.showDialog}
                    backdrop="static"
                    onHide={() => this.closeModal()}
                >
                    <Loading show={this.state.saving} />
                    <Modal.Header closeButton>
                        <Modal.Title>Crop Image</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Cropper
                            ref={ (crop) => { this.crop = crop } }
                            src={this.props.sourceUrl}
                            style={{height: 400, width: 400}}
                            aspectRatio={1}
                            viewMode={1}
                            guides={false}
                        />
                    </Modal.Body>
                    <Modal.Footer>
                        <button onClick={this.cropImage.bind(this)} className="btn btn-primary btn-block">Save</button>
                    </Modal.Footer>
                </Modal>
                <button className="btn btn-default btn-sm btn-block" onClick={this.openCropTool.bind(this)}> <i className="fa fa-crop"></i>Crop Image</button>
            </div>
        )

    }
}

export default ImageUpload;