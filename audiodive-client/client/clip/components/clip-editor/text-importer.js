import React, {Component} from 'react'
import {
    TextArea, Intent,
    Dialog,
} from "@blueprintjs/core"
import NiceButton from "../shared/nice-button"

class TextImporter extends Component {
    state = {
        rawText: ''
    }

    onTextChange = (e) => {
        this.setState({
            rawText: e.target.value
        })
    }

    render() {

        const {rawText} = this.state

        return <Dialog
            onClose={this.props.onClose}
            title={"Import Lyrics"}
            isOpen={true}>
            <div className={'bp3-dialog-body text-import'}>
                <div>
                    <TextArea
                        growVertically={true}
                        large={true}
                        intent={Intent.PRIMARY}
                        onChange={this.onTextChange}
                        value={rawText}
                    />
                </div>


                <NiceButton
                    disabled={!rawText}
                    intent={'link'}
                    text={'Import'}
                    icon="cloud-download-alt"
                    onClick={e => this.props.onImport(rawText)}
                />

            </div>
        </Dialog>
    }
}

export default TextImporter