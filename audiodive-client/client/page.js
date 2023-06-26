import React, {Component} from 'react'
import PropTypes from 'prop-types'

const Page = props => {

        const {pageName} = props

        let url = ''

        switch(pageName) {
            case 'login':
                url = '/login?iframe=true'
                break
            case 'account':
                url = '/account?iframe=true'
                break
            case 'signup':
                url = '/signup?iframe=true'
                break
            case 'terms':
                url = '/terms?iframe=true'
                break
            case 'privacy':
                url = '/legal/privacy?iframe=true'
                break
            default:
                break
        }

        const paddingLeft = (props.showMenu?'240px':'0px')

        return (
            <iframe
                style={{
                    paddingLeft,
                    height:window.innerHeight - 60 + 'px',
                    width:'100%'
                }}
                src={url}
            />
        )
}

Page.propTypes = {}

export default Page
