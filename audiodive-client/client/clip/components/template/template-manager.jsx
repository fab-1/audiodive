import ValidatedForm from '../shared/validated-form.jsx'
import React from 'react'
import axios from "axios/index"
import TemplateEditor from './template-editor.jsx'
import update from "immutability-helper/index"
import {
    Alert,
    Alignment,
    Button,
    ButtonGroup,
    Classes,
    Intent,
    Menu,
    MenuItem,
    Tooltip,
    NavbarDivider,
    NavbarGroup,
    Popover,
    Position,
    Slider
} from "@blueprintjs/core"
import {filterGeneric, renderGeneric} from "../../../shared/controls/custom-select"
import {Suggest, Select} from '@blueprintjs/select'
import {resetTemplate, saveTemplate} from "../../actions/template-actions"
import {ActionCreators} from "redux-undo"
import RATIO from '../../../shared/video-ratio'


import UI_TEXT from '../../ui-text'

class TemplateManager extends ValidatedForm(React.Component) {

    constructor() {
        super();

        this.state = {
            layouts: null,
            confirmDialog: false,
            activeRatio: RATIO.CONFIG_KEY.SQUARE
        };
    }

    componentDidMount() {
       this.loadLayouts();
    }

    loadLayouts(selectedId = null) {
        const load = axios.get(`/admin/api/template/index`)
        load.then(res => {
            //
            // const layouts = res.data.length? res.data: [{
            //     name: 'New Template',
            //     id: 0
            // }];

            this.setState({
                layouts: res.data
            }, () => {
                selectedId && this.props.history.push('/template/'+ selectedId)
            })
        })
    }

    loadLayout(selected) {
        this.props.history.push('/template/'+ selected.id)
    }

    deleteLayout() {
        axios.delete(`/admin/api/template/${this.props.templateId}`).
        then(res => {
            //this.loadLayouts()
            //this.layoutRef.store.dispatch(resetTemplate())
            this.props.history.push('/template')
        })
    }

    cloneSelected() {
        axios.post(`/admin/api/template/clone/${this.props.templateId}`).
        then(res => {
            this.loadLayouts(res.data.id)
        })
    }

    newLayout() {
        this.props.history.push('/template/create')
    }

    toggleDelete() {
        this.setState({
            confirmDialog: !this.state.confirmDialog
        })
    }

    saveCurrentLayout(){

        this.layoutRef.store.dispatch(saveTemplate()).
        then(res => {
            this.props.onLayoutSaved()
        })

    }


    switchRatio(ratio) {
        this.setState({
            activeRatio: ratio
        })

        //this.props.dispatch(ActionCreators.clearHistory())
    }

    onTemplateCreated(template) {
        this.loadLayouts()
        this.props.history.push('/template/' + template.id)
    }

    render() {

        const {renderLogo, renderNav, templateId} = this.props
        const {layouts, activeRatio} = this.state

        const layout = layouts && layouts.find(layout => layout.id === parseInt(templateId))

        return (
            <div>
                <Alert
                    intent={Intent.DANGER}
                    icon="trash"
                    isOpen={this.state.confirmDialog}
                    onConfirm={this.deleteLayout.bind(this)}
                    onCancel={this.toggleDelete.bind(this)}
                    cancelButtonText="Cancel"
                    confirmButtonText="Delete"
                >
                    <p>You are about to delete <strong>{layout && layout.name}</strong></p>
                </Alert>

                {
                    layouts && templateId &&
                    <TemplateEditor
                        layouts={layouts}
                        feeds={this.props.feeds}
                        ratio={activeRatio}
                        switchRatio={this.switchRatio.bind(this)}
                        //key={`${this.state.currentLayoutId}-${this.state.activeRatio}`}
                        viewportScale={this.state.viewportScale}
                        id={templateId}
                        onSaved={this.onTemplateCreated.bind(this)}
                        ref={ref => this.layoutRef = ref}
                        history={this.props.history}
                        onCloneTemplate={this.cloneSelected.bind(this)}
                        onDeleteTemplate={this.toggleDelete.bind(this)}


                        renderLogo={renderLogo}
                        renderNav={renderNav}
                        // renderNav={<NavbarGroup>
                        //     <Select
                        //         noResults={<MenuItem disabled={true} text="No results." />}
                        //         items={layouts}
                        //         itemPredicate={filterGeneric}
                        //         itemRenderer={renderGeneric}
                        //         onItemSelect={this.loadLayout.bind(this)}>
                        //
                        //         <Button
                        //             className='bp3-fill'
                        //             rightIcon="caret-down"
                        //             text={layout ? layout.name : 'Select a template'}
                        //         />
                        //     </Select>
                        //
                        //     <NavbarDivider />
                        //
                        //     <Button
                        //         minimal={true}
                        //         text="New"
                        //         icon="add"
                        //         onClick={this.newLayout.bind(this)}
                        //     />
                        //
                        // </NavbarGroup>}
                    />
                }

            </div>
        )
    }
}

const NOOP = ()=>{}

TemplateManager.defaultProps = {
    onLayoutSaved: NOOP
}

export default TemplateManager;