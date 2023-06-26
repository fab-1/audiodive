import {Alignment, Navbar, Button, H2, H4, NavbarGroup, NavbarHeading} from "@blueprintjs/core"
import React from 'react'
import {QueryList} from "@blueprintjs/select"
import {Card, Media, Heading, Content} from 'react-bulma-components'


const GettingStarted = props => {

    return <div className='content pricing-page'>

        <H2>Creating a new clip</H2>

        <p>You can create a new clip by clicking on Import Clip</p>


        <H4> Importing Your content </H4>
        <p>You can import content with the clip wizard via 3 different ways:</p>
        <dl>
            <dd>Upload a file</dd>
            <dt>Use this if you already have a an audio file handy (mp3, wav). You can also drag a drop the file in your browser.</dt>

            <dd>Recording yourself</dd>
            <dt> This option allows you to record yourself directly from the app. This can be useful if you need to create a quick personalized message for a friend or to share on social media</dt>

            <dd>Cut a clip </dd>
            <dt>This option allows you to cut a highlight from any podcast available on iTunes. In order to find your highlight, you will need to add the podcast. You can do so by clicking on "Add a Podcast" from the left menu.</dt>
        </dl>

        <p>Once you have done this step, you will have the ability to choose the audio segment you need to import. The allowed length of the audio segment will depends on your plan (1mn max for the free plan). There is a also a limit of total amount of audio you want to import (10mn for the free plan).</p>

        <p>Once you have selected your segment, you have the option of transcribing your audio, and selecting the language (defaults to english). If you have multiple characters, you can choose the option "Multiple Characters" and the transcribed audio will split the conversation blocks based on the speaker.</p>

        <H4> Quick Clip Setup</H4>

        <p>Once you have imported your audio, you'll have the ability to quickly change the most important aspects of your clip, like the background images, your logo, or the speakers under the section "Clip Info And Visuals". You can also hide any element you don't need by checking the toggle off next to the element name.</p>

        <p>You can also adjust and correct the transcript under the "Transcript" tab. Note that you can also do this steps in the Clip Editor.</p>

        <p>If you are happy with the previewed clip, you can can already export it by clicking "Export Video", if you want to customize your clip further (and you are using a desktop), you can go to the Clip Editor</p>
    </div>

}

export default GettingStarted