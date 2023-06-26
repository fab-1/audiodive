import React from 'react';
import { H2 } from '@blueprintjs/core'
import debounce from 'lodash/debounce'
import NiceButton from "./shared/nice-button"
import axios from 'axios'
import Loading from "./shared/loading"

const isEmail = (email = null) => {
    const regex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return regex.test(email);
}

class UserProfile extends React.Component {

    constructor() {
        super()

        this.debounceCheck = debounce(this.hasErrors, 500)
    }

    state = {
        saving: false,
        user: {
            fullName: null,
            emailAddress: null,
            password: null
        },
        errors: {}
    }

    componentDidMount() {
        if (this.props.isLoggedIn) {

        }
        else {
        }
    }

    signup = async () => {
        const {user, errors} = this.state

        this.setState({saving: true})

        try {
            const res = await axios.post('/api/v1/entrance/signup', {
                ...user
            })
        }
        catch(e) {
            errors.server = 'Error while saving your profile'
        }

        this.setState({saving: false, errors})

        if (!errors.server) {
            this.props.onClose()
            this.props.onSuccess()
        }

    }

    onChange = (e) => {
        const {user} = this.state

        user[e.target.name] = e.target.value

        this.setState({user})

        this.debounceCheck()
    }


    hasErrors = () => {
        let errors = {}
        const {fullName, emailAddress, password} = this.state.user

        if (fullName != null && fullName.length < 4) {
            errors.fullName = 'Name must be more than 4 characters'
        }

        if (emailAddress != null && !isEmail(emailAddress)) {
            errors.emailAddress = 'Invalid Email'
        }

        if (password != null && password.length < 7) {
            errors.password = 'Password is not valid'
        }

        this.setState({errors})

        return Object.keys(errors).length > 0 || fullName === null || emailAddress === null || password === null
    }

    render() {

        const { errors, user, saving } = this.state
        const {fullName, emailAddress, password} = user

        const hasErrors = Object.keys(errors).length > 0 || fullName === null || emailAddress === null || password === null//this.hasErrors()

        return <div className='user-profile'>

            <H2>Sign up</H2>

            <Loading show={saving}  />

            {
                errors['server'] &&
                <article className="bu-message is-danger">
                    <div className="bu-message-body">
                        {errors['server']}
                    </div>
                </article>
            }

            <div className="bu-field">
                <label className="bu-label">Name</label>
                <div className="bu-control bu-has-icons-left bu-has-icons-right">
                    <input className={"bu-input bu-is-medium " + (errors['fullName']?'bu-is-danger':'bu-is-info')}
                           name={'fullName'} onChange={this.onChange}
                           value={user.fullName}
                           type="text" placeholder="Name" />
                    <span className="bu-icon bu-is-medium bu-is-left">
                        <i className="fas fa-user" />
                    </span>


                    {
                        errors['fullName'] && <span className="bu-icon bu-is-small bu-is-right">
                            <i className="fas fa-exclamation-triangle"></i>
                        </span>
                    }
                </div>

                <p className="bu-help bu-is-danger">{errors['fullName']}</p>
            </div>

            <div className="bu-field">
                <label className="bu-label">Email</label>
                <div className="bu-control bu-has-icons-left bu-has-icons-right">
                    <input
                        name={'emailAddress'} value={user.emailAddress}
                        onChange={this.onChange}
                        className={"bu-input bu-is-medium " + (errors['emailAddress']?'bu-is-danger':'bu-is-info')} type="email" placeholder="your@email.com" />
                    <span className="bu-icon bu-is-medium bu-is-left">
                      <i className="fas fa-envelope "></i>
                    </span>

                    {
                        errors['emailAddress'] && <span className="bu-icon bu-is-small bu-is-right">
                            <i className="fas fa-exclamation-triangle"></i>
                        </span>

                    }
                </div>
                <p className="bu-help bu-is-danger">{errors['emailAddress']}</p>
            </div>

            <div className="bu-field">
                <label className="bu-label">Password</label>
                <div className="bu-control bu-has-icons-left bu-has-icons-right">
                    <input
                        className={"bu-input bu-is-medium " + (errors['password']?'bu-is-danger':'bu-is-info')}
                        type="password" placeholder="password" name={'password'} value={user.password}
                        onChange={this.onChange}
                    />
                    <span className="bu-icon bu-is-medium bu-is-left">
                      <i className="fas fa-key"></i>
                    </span>
                    {
                        errors['password'] && <span className="bu-icon bu-is-medium bu-is-right">
                            <i className="fas fa-exclamation-triangle"></i>
                        </span>
                    }
                </div>
                <p className="bu-help bu-is-danger">{errors['password']}</p>
            </div>

            <div className='bu-buttons margin-top-40'>
                <NiceButton large="true" text="Login" onClick={this.props.onLogin} />
                <NiceButton disabled={hasErrors} intent={'info'} large="true" text="Sign up" onClick={this.signup} />
            </div>

        </div>
    }
}

export default UserProfile