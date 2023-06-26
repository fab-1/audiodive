import React from "react"
import {fabric} from 'fabric'
import shortId from "shortid"
import SHAPES from './shapes'

fabric.Object.NUM_FRACTION_DIGITS = 5;
fabric.Canvas.prototype.getItemById = function(id) {
    let object = null,
        objects = this.getObjects();

    for (let i = 0, len = this.size(); i < len; i++) {
        if (objects[i].id && objects[i].id === id) {
            object = objects[i];
            break;
        }
    }

    return object;
};

// Save additional attributes in Serialization
fabric.Object.prototype.toObject = (function (toObject) {
    return function (properties) {

        let existing = toObject.call(this, properties)
        const IGNORE = [
            "cropX",
            "cropY",
            "flipX",
            "flipY",
            "skewX",
            "skewY",
            "shadow",
            "stroke",
            "filters",
            "fillRule",
            "paintFirst",
            "strokeWidth",
            "strokeLineCap",
            "strokeLineJoin",
            "backgroundColor",
            "strokeDashArray",
            "transformMatrix",
            "strokeDashOffset",
            "strokeMiterLimit",
            "globalCompositeOperation",
            "opacity"
        ]

        IGNORE.forEach(prop => delete existing[prop])

        return fabric.util.object.extend(existing, {
            id: this.id,
            name: this.name,
            textElement: this.textElement,
            collapsed: this.collapsed,
            animStates: this.animStates,
            clonedFrom: this.clonedFrom,
            imgSrc: this.imgSrc
        });
    };
})(fabric.Object.prototype.toObject)

const DEFAULT_PROPERTIES = {
    left: 0,
    top:0,
    fill: 'rgba(0,0,0,0)',
    width : 400,
    height: 400,
    strokeWidth: 0,
    padding: 0
}

fabric.Shallow = fabric.util.createClass(fabric.Rect, {
    type: 'shallow'
})

fabric.HtmlText = fabric.util.createClass(fabric.Rect, {
    type: 'htmlText'
})

fabric.HtmlText.fromObject = function(options, callback) {
    const instance = new fabric.HtmlText(options, callback)
    callback && callback(instance)
}
fabric.Image2 = fabric.util.createClass(fabric.Rect, {
    type: 'image2',
    imgSrc: ''
})

fabric.Image2.fromObject = function(options, callback) {
    const instance = new fabric.Image2(options, callback)
    callback && callback(instance)
}

class ReactFabric extends React.Component {

    componentDidMount() {

        this.canvas = new fabric.Canvas(this.props.canvasId, {selection: false})
        this.canvas.backgroundColor = null

        console.log('mount fabric')

        this.canvas.on('mouse:over', (e) => {
            e.target && e.target.set('fill', 'rgba(50, 115, 220, 0.5)');
            this.canvas.renderAll();
        });

        this.canvas.on('mouse:out', (e) => {
            e.target && e.target.set('fill', 'rgba(0,0,0,0)');
            this.canvas.renderAll();
        });

        const onObjectSelected = (e) => {
            const [ob] = e.selected
            this.props.onObjectSelected(ob.id)
        }

        this.canvas.on('selection:created', onObjectSelected)
        this.canvas.on('selection:updated', onObjectSelected)
        this.canvas.on('selection:cleared', e => {

            const [ob] = e.deselected
            if (this.props.playerMode) {
                this.selectObject(ob.id)
            }

            this.props.onObjectSelected(null)
        })
        this.canvas.on('object:modified', e => this.onFabricChange())

        let canvasData = this.props.defaultData
        if (canvasData) {
            console.log('loading data')
            canvasData.background = 'rgba(0,0,0,0)'
            this.loadCanvasData(canvasData)
        }
        else {
            //this.addTextArea()
            //this.addDynamicArea()
            this.canvas.renderAll()
            this.canvas.getObjects().forEach(obj => this.objectInit(null, obj))
            this.props.onCanvasReady(this)
        }

        this.canvas.controlsAboveOverlay = true
    }

    componentWillUnmount() {
        console.log('unmount fabric')
        this.canvas.dispose()
        this.props.onCanvasDestroyed()
    }

    loadCanvasData(data) {

        console.log('loading', data)

        // const newObj = data.objects.map(obj => {
        //     if (obj.type === 'image') {
        //         obj.type = 'customImage'
        //     }
        //     return obj
        // })
        // data.objects = newObj

        this.canvas.loadFromJSON(data, this.onCanvasLoaded, this.objectInit)
    }

    onCanvasLoaded = () => {
        this.canvas.getObjects().forEach(obj => {})
        this.canvas.set({
            controlsAboveOverlay: true
        })
        this.props.onCanvasReady(this)
    }


    objectInit = (e, obj) => {

        if (!obj) {
            return
        }

        if (this.props.playerMode) {
            obj.set({
                lockMovementX: false,
                lockMovementY: false,
                lockScalingX: false,
                lockScalingY: false,
                lockRotation: true,
                lockUniScaling: false,
                selectable: false
            })
        }

        this.props.readOnly && obj.set({fill: 'rgba(0,0,0,0)'})

        switch (obj.id) {
            case 'textArea':
                this.applySpecialControls(obj, '#48AFF0')
                break

            case 'dynamicArea':
                obj.selectable = false
                this.applySpecialControls(obj, '#D9822B')
                break

            case 'visArea':
                this.applySpecialControls(obj, '#5642A6')
                break

            case SHAPES.PROGRESS:
                this.applySpecialControls(obj, '#9BBF30')
                break

            case 'shallow':
                this.applySpecialControls(obj, '#eb532d')
                break
        }

        switch (obj.type) {
            case 'image':
                obj.set({opacity: 0})
                this.applySpecialControls(obj, '#eb532d')
                break

            case 'image2':
                obj.set({opacity: 0})
                this.applySpecialControls(obj, '#eb532d')
                break

            case 'htmlText':
                this.applySpecialControls(obj, '#137CBD')
                break
        }
    }


    // componentDidUpdate(oldProps) {
    //     if (oldProps.defaultData !== this.props.defaultData) {
    //         console.log('NEW CONFIG')
    //     }
    // }

    componentDidUpdate(oldProps) {

        if (oldProps.defaultData !== this.props.defaultData) {
            console.log('NEW CONFIG')
            if (this.props.defaultData) {

                if (this.canvas) {
                
                    this.canvas.clear()
                }

                this.loadCanvasData(this.props.defaultData)
            }
            else {
                //
            }
        }
    }


    onFabricChange(removedId){
        const json = this.getCanvasData()
        this.props.onFabricChange(json, removedId)
    }

    //Add custom resize handlers and selection outline
    applySpecialControls(obj, color) {
        obj.set({
            lockRotation: false,
            borderColor: color,
            cornerColor: color,
            cornerSize: 10,
            transparentCorners: false,
            lockUniScaling: true//obj.type === 'image'
        })
    }

    addShallow(properties= {}) {
        const shallowProperties = Object.assign({}, {
            id:'shallow',
            name: 'Shallow',
            fill: 'rgba(255,255,255,0.1)'
        }, properties)

        const shallow = new fabric.Rect(shallowProperties)
        this.objectInit(null, shallow)
        this.canvas.add(shallow)
        this.canvas.setActiveObject(shallow)
        //this.onFabricChange()

        return shallow
    }

    addTextArea() {
        console.log('adding text area')
        const textProperties = Object.assign(DEFAULT_PROPERTIES, {
            id:'textArea',
            name: 'Dynamic Text',
            width : 600
        })

        const textBackground = new fabric.Rect(textProperties)
        this.objectInit(null, textBackground)
        this.canvas.add(textBackground)
        this.onFabricChange()

        return textBackground
    }

    addVisArea() {
        const visProperties = Object.assign(DEFAULT_PROPERTIES, {
            id:'visArea',
            name: 'Visualization',
            width : 600,
            height: 260,
        })

        const visObject = new fabric.Rect(visProperties)
        this.objectInit(null, visObject)
        this.canvas.add(visObject)
        this.onFabricChange()

        return visObject
    }

    addProgress() {
        const visProperties = Object.assign(DEFAULT_PROPERTIES, {
            id:'progress',
            name: 'Clip Progress',
            width : 600,
            height: 20
        })


        const visObject = new fabric.Rect(visProperties)
        this.objectInit(null, visObject)
        this.canvas.add(visObject)
        this.onFabricChange()

        return visObject
    }

    addParticles() {
        const visProperties = Object.assign(DEFAULT_PROPERTIES, {
            id:'particles',
            name: 'Particles',
            width : 720,
            height: 720
        })

        const visObject = new fabric.Rect(visProperties)
        this.objectInit(null, visObject)
        this.canvas.add(visObject)
        this.onFabricChange()

        return visObject
    }

    addHtmlText() {
        const visProperties = Object.assign(DEFAULT_PROPERTIES, {
            id: 'html_' + shortId.generate(),
            name: 'Static Text',
            width : 600,
            height: 260,
        })

        const visObject = new fabric.HtmlText(visProperties)
        this.objectInit(null, visObject)
        this.canvas.add(visObject)
        this.onFabricChange()

        return visObject
    }

    addDynamicArea() {
        const dynamicArea = Object.assign({
            id:'dynamicArea',
            name: 'Dynamic Medias',
            top: 0,
            left: 0,
            fill: 'rgba(0,0,0,0)',
            width: this.props.width || 720,
            height: this.props.height || 720,
        })

        const mediaBackground = new fabric.Rect(dynamicArea)
        this.objectInit(null, mediaBackground)
        this.canvas.add(mediaBackground)
        this.onFabricChange()

        return mediaBackground
    }

    addImage2(url, image) {
        const id = shortId.generate()

        const {width, height, left, top} = image
        let imgConfig = {
            id,
            name: 'Image '  + (url.indexOf('gif') > -1?'(GIF)':''),
            left,
            top,
            width,
            height,
            scaleX: 1,
            scaleY: 1,
            imgSrc: url
        }

        const imgObject = new fabric.Image2(imgConfig)
        this.objectInit(null, imgObject)
        this.canvas.add(imgObject)
        this.onFabricChange()

        return imgObject
    }

    addImage(url, callback = ()=>{}, image) {
        const img = fabric.Image.fromURL(url, imgObject => {
            const id = shortId.generate()

            const {width, height, left, top} = image
            let imgConfig = {
                id: id,
                name: 'Image '  + (url.indexOf('gif') > -1?'(GIF)':''),
                left,
                top,
                width,
                height,
                scaleX: 1,
                scaleY: 1
            }

            imgObject.set(imgConfig)
            this.objectInit(null, imgObject)
            this.canvas.add(imgObject)
            this.selectObject(id)
            this.onFabricChange()
            callback(id)

        }, {crossOrigin: 'anonymous'})

        return img
    }

    updateImage() {

    }

    renderAll() {
        this.canvas.renderAll()
    }

    deleteObject(id) {
        const fabricObj = this.canvas.getItemById(id)

        try {
            this.canvas.remove(fabricObj)
        }
        catch(e) {console.log(e)}

        this.canvas.renderAll()
        this.onFabricChange(id)
    }

    execMethod(id, method, value, callback, image) {
        const fabricObj = this.canvas.getItemById(id)

        if (method === 'copy') {

            fabricObj.clone(clone => {
                clone.id = shortId.generate()
                clone.name = 'Copy of ' + clone.name
                clone.clonedFrom = id
                this.canvas.add(clone)
                this.canvas.renderAll()
                this.objectInit(null, clone)
                this.onFabricChange()
            })

            return
        }

        if (fabricObj[method]) {

            if (method === 'setSrc') {
                //const originalHeight = fabricObj.getScaledHeight()
                const originalWidth = fabricObj.getScaledWidth()

                fabricObj.setSrc(value, () => {
                    callback && callback()

                    const {width, height, left, top} = image
                    fabricObj.set({
                        left,
                        top,
                        width,
                        height,
                        scaleX: 1,
                        scaleY: 1
                    })
                    this.onFabricChange()
                })

            }
            else {
                fabricObj[method](value)
                this.onFabricChange()
            }

        }
    }

    selectObject(id) {
        const fabricObj = this.canvas.getItemById(id)
        if (fabricObj) {
            this.canvas.setActiveObject(fabricObj)
            this.canvas.renderAll()
        }

        console.log('select')
    }

    updateObject(id, property, value){

        const fabricObj = this.canvas.getItemById(id)

        if (typeof value === 'object') {
            value = Object.assign(value, fabricObj[property])
        }

        if (property === 'width' && id !== SHAPES.PROGRESS){
            property = 'scaleX'
            value = value / fabricObj.width
        }

        if (property === 'height' && id !== SHAPES.PROGRESS) {
            property = 'scaleY'
            value = value / fabricObj.height
        }

        fabricObj.set({[property]: value})

        this.canvas.renderAll()
        this.onFabricChange()
    }

    scaleObject(id, property, value) {

        const fabricObj = this.canvas.getItemById(id)

        const dimension = (property === 'scaleX'? 'width':'height')

        const newScale = value/fabricObj[dimension]

        fabricObj.set({[property]: newScale})


        if (fabricObj.lockUniScaling) {
            const otherAxis = (property === 'scaleX'? 'scaleY':'scaleX')
            fabricObj.set({[otherAxis]: newScale})
        }

        this.canvas.renderAll()
        this.onFabricChange()
    }

    getObject(id) {
        return this.canvas.getItemById(id)
    }

    getObjects() {
        return this.canvas.getObjects()
    }

    discardSelection() {
        this.canvas.discardActiveObject()
        this.canvas.renderAll()
    }

    getCanvasData() {
        return this.canvas.toDatalessJSON()
    }

    render() {
        return (<canvas
            id={this.props.canvasId}
            width={this.props.width || 1280}
            height={this.props.height || 720} />)
    }
}

ReactFabric.defaultProps = {
    onObjectSelected: ()=>{},
    onObjectModified: ()=>{}
}

export default ReactFabric;