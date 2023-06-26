import {Classes, Intent, Position, Popover} from "@blueprintjs/core"
import NiceButton from '../clip/components/shared/nice-button'
import UserForm from '../clip/components/user-form'
import React from 'react'

function isMobileDevice() {
    return (typeof window.orientation !== "undefined") || (navigator.userAgent.indexOf('IEMobile') !== -1);
}



const NavigationBar = (props) => {

    const {showMenu, toggleMenu, user, userPlan, showSettings, toggleSettings, openProfile, openLogin} = props
    const {entityType, entityId} = props.match.params
    const isWizard = entityType === 'wizard'
    const isWizardUpload = isWizard
    const isWizardEdit = isWizard && entityId

    const openPage = (pageName) => {
        if (isMobileDevice()) {
            toggleMenu(_, true)
        }
        props.history.push('/page/'+pageName)
    }

    return <nav className={'bu-navbar bu-navbar-small ' + props.className} role="navigation" aria-label="main navigation">

        <div className={'bu-navbar-brand'}>
            <div className='bu-navbar-item'>
                <NiceButton icon={'bars'} intent={'info'} active={showMenu} onClick={toggleMenu} />
            </div>
        </div>
        <div className='bu-navbar-menu'>


            {/*<ul className="bp3-breadcrumbs">*/}
            {/*<li>*/}
            {/*<a className="bp3-breadcrumb" onClick={_ => props.history.push('/library')}>*/}
            {/*<div className='audiodive-logo'/>*/}
            {/*</a>*/}
            {/*</li>*/}

            {/*{*/}
            {/*isWizard &&*/}
            {/*<li><Breadcrumb text={'Clip Builder'} disabled={true} /></li>*/}
            {/*}*/}

            {/*</ul>*/}
            {
                user && user.isLoggedIn &&
                <div className='bu-navbar-item'>
                    {
                        props.match.url === '/library' &&
                        <NiceButton
                            text='New Clip'
                            intent={'info'}
                            onClick={e => props.history.push('/library/wizard')}
                            icon={'film'}
                        />
                    }

                </div>
            }


            {props.children}

            <div className={'navbar-portal'} />

            {
                !user || !user.isLoggedIn &&
                <div className='bu-navbar-item margin-left-auto bu-buttons'>
                    <NiceButton
                        minimal={true}
                        intent={'info'}
                        className={Classes.MINIMAL + ' bp3-large'}
                        icon="user"
                        text='Login'
                        onClick={openLogin}
                    />
                    <NiceButton
                        intent={'info'}
                        className={Classes.MINIMAL + ' bp3-large'}
                        text='Signup'
                        onClick={openProfile}
                    />
                </div>
            }


            {
                user && user.isLoggedIn &&
                <div className='bu-navbar-item margin-left-auto'>

                    <Popover
                        usePortal={false}
                        isOpen={showSettings}
                        //onClose={toggleSettings}
                        position={Position.TOP_RIGHT}
                        content={<UserForm
                            user={user}
                            userPlan={userPlan}
                            openAccountSettings={_ => {
                                if (isMobileDevice()) {
                                toggleMenu(_, true)
                            }
                                props.history.push('/page/account')
                            }}
                        />}>
                        <NiceButton

                            minimal={true}
                            onClick={toggleSettings}
                            intent={'info'}
                            className={Classes.MINIMAL + ' bp3-large'}
                            icon="user"
                        />
                    </Popover>

                </div>
            }


        </div>

    </nav>
}

export default NavigationBar