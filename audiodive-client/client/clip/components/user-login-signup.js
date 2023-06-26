import React, {Component, useState}  from 'react';
import UserLogin from "./user-login"
import UserProfile from "./user-profile"
import NiceButton from "./shared/nice-button"


const UserLoginSignup = (props) => {

    const [section, setSection] = useState(props.section || 'login');

    return (<div>

        <NiceButton className='close-button' large={true} icon={'times'} onClick={props.onClose} />

        {
            section === 'login' &&
            <div>
                <UserLogin
                    onSignup={() => setSection('signup')}
                    onClose={props.onClose}
                    onSuccess={props.onSuccess}
                />
            </div>
        }

        {
            section === 'signup' &&
            <div>
                <UserProfile
                    onLogin={() => setSection('login')}
                    onClose={props.onClose}
                    onSuccess={props.onSuccess}
                />
            </div>
        }

    </div>)

}

export default UserLoginSignup