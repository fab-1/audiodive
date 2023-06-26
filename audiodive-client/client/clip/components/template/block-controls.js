import React from "react"
import {
    Alignment,
    AnchorButton,
    Button,
    ButtonGroup,
    Classes,
    Icon,
    Intent,
    Menu,
    MenuItem,
    NumericInput,
    Popover,
    Position,
    TextArea,
    Tooltip,
    FormGroup,
    Tree,
    Switch
} from "@blueprintjs/core"
import {Select} from '@blueprintjs/select'
import {filterGeneric, renderGeneric} from "../../../shared/controls/custom-select"
import CustomIcons from "../../../shared/custom-icons"
import UI_TEXT from "../../ui-text"

export default class BlockControls extends React.Component {

    onKeyDown(e){
        console.log(e)
    }

    render() {

        const {selectedBlock, propertyChange, allWordsById, templates, currentWords, globalId} = this.props

        let selectedLayoutId = parseInt(selectedBlock.layout) || globalId

        const layout = templates && templates.find(layout => layout.id === selectedLayoutId)


        return <div onKeyDown={this.onKeyDown.bind(this)}>

            <FormGroup label={'Block'}>
                <TextArea
                    value={currentWords.map(id => allWordsById[id].word).join(' ')}
                    fill={true}
                    readOnly={true}
                />
            </FormGroup>

            <FormGroup
                       helperText={selectedLayoutId === globalId? 'Currently set to default template':'Custom template assigned'}>
                {
                    templates && layout &&
                    <Select
                        noResults={<MenuItem disabled={true} text="No results." />}
                        items={templates}
                        popoverProps={{
                            position: Position.LEFT
                        }}
                        itemPredicate={filterGeneric}
                        itemRenderer={renderGeneric}
                        onItemSelect={ val => propertyChange(selectedBlock.id, {'layout': val.id}) }>

                        <Button
                            className="bp3-button bp3-icon-style"
                            rightIcon={'caret-down'}>
                            {selectedLayoutId === globalId? <span className='bp3-text-muted'>Custom Template</span>: layout.name}
                        </Button>
                    </Select>
                }

                {
                    selectedBlock.layout && <Button text={'clear'} onClick={_ => propertyChange(selectedBlock.id, {'layout': undefined}) }  />
                }

            </FormGroup>

            <section className={'margin-bottom-10'}>
                <Switch
                    checked={selectedBlock.muted || false}
                    label="Mute/Hide this Block"
                    onChange={e => propertyChange(selectedBlock.id, {'muted': !selectedBlock.muted})}
                />
            </section>
        </div>
    }
}

