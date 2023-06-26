import React from "react"
import axios from "axios"

class DataComponent extends React.Component {

    loadData() {
        axios.get('/admin/api/user/current').then(res => {
            const user = res.data
            this.setState({user})

            console.log('user ', user)
            if (user.loggedIn) {

                this.loadAllData()

                axios.get(`/admin/api/user/plan`).
                then(res => {
                    this.setState({
                        userPlan: res.data
                    })
                })
            }
            else {
                this.loadLocalData()

                this.setState({
                    feedsById:{},
                    feeds:[],
                    myFeeds:[],
                    templates: []
                })
            }
        })
    }

    loadUser(){
        const pr = axios.get('/admin/api/user/current')
        pr.then(res => {
            const user = res.data
            this.setState({user})
        })
        return pr
    }

    clipsReady() {

    }

    loadLocalData() {

        console.log('local data')

        let {clipsById} = this.state

        if (!clipsById) {
            clipsById = {}
        }

        const getClips = axios.get('/admin/api/clip/index')
        const loadTemplates = this.loadLibraryTemplates()

        // axios.get('/admin/api/template/library').
        // then(res => {
        //     const libraryTemplates = res.data
        //     this.setState({libraryTemplates})
        // })

        return Promise.all([getClips, loadTemplates]).then(([clipsRes, libraryTemplatesRes]) => {
            clipsRes.data.forEach(clip => clipsById[clip.id] = clip)
            clipsRes.data.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
            this.setState({
                clips: clipsRes.data,
                clipsById,
                libraryTemplates: libraryTemplatesRes.data
            })
        });
    }

    loadLibraryTemplates() {
        const promise = axios.get('/admin/api/template/library')
        return promise;
    }

    loadTemplates() {

    }

    loadAllData() {

        this.setState({
            loading: true
        })

        axios.get('/admin/api/feed/index').
        then(results => {

            const feeds = results.data

            let myFeeds = [{
                name: 'My Show',
                id: null
            }]

            let feedsById = {}

            feeds.forEach(feed => {

                feedsById[feed.id] = feed

                if (feed.UserPodcasts.length) {
                    myFeeds.push(feed)
                }

                if (feed.id === 1 && this.state.user.isSuperAdmin) {
                    myFeeds.push(feed)
                }
            })

            this.setState({feedsById, feeds, myFeeds})
        })

        axios.get('/admin/api/clip/mine').
        then(results => {

            const myClips = results.data

            const clipsById = {}
            const handleClip = clip => {

                clipsById[clip.id] = clip

                // //add clip to feed list
                // if (feedsById[clip.PodcastFeedId]) {
                //     feedsById[clip.PodcastFeedId].clipIds = feedsById[clip.PodcastFeedId].clipIds || []
                //     feedsById[clip.PodcastFeedId].clipIds.push(clip.id)
                // }
                // else {
                //     console.warn('feed missing for clip ', clip)
                // }
            }


            myClips.forEach(handleClip)
            myClips.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))


            this.setState({
                myClips,
                clipsById,
                loading: false
            }, this.loadLocalData.bind(this))
        })

        axios.get('/admin/api/template/index').
        then(res => {
            const templates = res.data
            this.setState({templates})
        })


        axios.get('/admin/api/template/library').
        then(res => {
            const libraryTemplates = res.data
            this.setState({libraryTemplates})
        })
    }

    render(){return null}
}

export default DataComponent