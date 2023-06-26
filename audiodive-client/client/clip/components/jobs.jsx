import React, {Component} from 'react'
import PropTypes from 'prop-types'
import axios from 'axios'
import {
    Icon, Intent,
    Alignment,
    Button,
    ButtonGroup,
    Popover,
    Classes,
    Position,
    H5,
    NavbarDivider,
    MenuDivider,
    NavbarGroup,
    NavbarHeading,
    ProgressBar,
    MenuItem,
    Slider,
    Menu
} from "@blueprintjs/core";
import {Link} from "react-router-dom"

class Jobs extends Component {


    constructor(){
        super()

        this.state = {
            jobs: []
        }
    }

    loadJobs() {
        this.props.refreshJobs()
    }

    componentDidMount(){
        this.loadJobs()
    }

    componentWillUnmount() {
        this.props.onJobClose && this.props.onJobClose()
    }

    static getDerivedStateFromProps(nextProps, prevState) {

        const sortFunction = (a, b) => {
            const aTime = a.finishedOn || a.processedOn
            const bTime = b.finishedOn || b.processedOn
            return bTime - aTime
        }

        if (nextProps.jobs && nextProps.jobs !== prevState.jobs) {
            return {
                jobs: nextProps.jobs,
                sortedJobs: nextProps.jobs.sort(sortFunction)
            }
        }

        return null
    }

    checkTimeout(){

    }

    retry(id) {
        axios.post('/admin/api/job/' + id, {
            action: 'retry'
        }).
        then(res => this.loadJobs())
    }


    cancel(id) {
        axios.delete('/admin/api/job/' + id).
        then(res => this.loadJobs())
    }

    remove(id) {
        axios.post('/admin/api/job/' + id, {
            action: 'remove'
        }).
        then(res => this.loadJobs())
    }

    getJobStatus = job => {
        if (job.failedReason) {
            return {code: 'failed', className: Classes.INTENT_DANGER}
        }

        if (job.finishedOn && job.processedOn < job.finishedOn) {
            return {code: 'ready', className: Classes.INTENT_SUCCESS}
        }

        return {code: 'active', className: Classes.INTENT_PRIMARY}
    }

    render() {

        const formatDate = (date) => {
            const d = new Date(date);
            const options = { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: 'numeric' };
            return d.toLocaleDateString( undefined, options);
        }

        const {feedsById, clipsById} = this.props
        const {jobs} = this.state

        const getIcon = job => {
            switch(job.name) {
                case 'clip':
                    return 'film'

                case 'transcript':
                    return 'manually-entered-data'

                case 'audio-cut':
                    return 'cut'
            }
        }

        return (
            <ul className='jobs-overlay bp3-list-unstyled'>
                {
                    jobs.length === 0 &&
                    <H5 className='no-active-job'>No Active Job</H5>
                }
                {
                    jobs.map(job => {

                        const status = this.getJobStatus(job)
                        const icon = getIcon(job)
                        const clip = clipsById[job.data.clipId]

                        return <li key={job.name + job.id}>
                            <H5>
                                <Link className="bp3-button bp3-intent-primary bp3-minimal" to={`/library/clip/${job.data.clipId}`}>
                                    <Icon icon={icon} /> {clip?clip.name:`${job.name} ${job.data.clipId}`}
                                </Link>
                            </H5>

                            {
                                status.code === 'active' &&
                                <div>
                                    <span className={'bp3-tag ' + status.className}>{status.code}</span>
                                    <Button className={'push-right bp3-minimal'} icon={'trash'} onClick={this.cancel.bind(this, job.id)}/>
                                    <ProgressBar style={{width: '80%'}} intent={Intent.PRIMARY} value={job.progress/100} />
                                </div>
                            }

                            {
                                status.code === 'ready' &&
                                <p className='bp3-text-muted'>Completed {formatDate(job.finishedOn)}</p>
                            }

                            {
                                status.code === 'failed' &&
                                <div className='flex'>
                                    <span className={'bp3-tag ' + status.className}>{status.code}</span>
                                    <ButtonGroup className={'push-right'} minimal={true}>
                                        {/*<Button icon={'refresh'} onClick={this.retry.bind(this, job.id)}/>*/}
                                        <Button icon={'trash'} onClick={this.remove.bind(this, job.id)}/>
                                    </ButtonGroup>
                                </div>
                            }

                        </li>})
                }
            </ul>
        )
    }
}

Jobs.propTypes = {}

export default Jobs
