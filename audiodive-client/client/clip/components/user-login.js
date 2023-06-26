import React from 'react';
import { useForm } from 'react-hook-form';
import { H2 } from '@blueprintjs/core'
import debounce from 'lodash/debounce'
import NiceButton from "./shared/nice-button"
import axios from 'axios'
import Loading from "./shared/loading"

const isEmail = (email = null) => {
    const regex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return regex.test(email);
}


export default class UserLogin extends React.Component {

    state = {
        saving: false,
        user: {
            fullName: null,
            emailAddress: null,
            password: null
        },
        errors: {}
    }

    constructor() {
        super()

        this.debounceCheck = debounce(this.hasErrors, 500)
    }

    componentDidMount() {
        if (this.props.isLoggedIn) {

        }
        else {
        }
    }

    signup = async (event) => {
        const {user, errors} = this.state

        event.preventDefault();

        this.setState({saving: true})

        try {
            const res = await axios.put('/api/v1/entrance/login', {
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

        return false;
    }

    onChange = (e) => {
        const {user} = this.state

        user[e.target.name] = e.target.value

        this.setState({user})

        this.debounceCheck()
    }


    hasErrors = () => {
        let errors = {}
        const {emailAddress, password} = this.state.user

        if (emailAddress !== '' && !isEmail(emailAddress)) {
            errors.emailAddress = 'Invalid Email'
        }

        if (password !== '' && password.length < 7) {
            errors.password = 'Password is not valid'
        }

        this.setState({errors})

        return Object.keys(errors).length > 0 || emailAddress === null || password === null
    }

    render() {

        const { errors, user, saving } = this.state
        const {emailAddress, password} = user

        const hasErrors = Object.keys(errors).length > 0 || emailAddress === null || password === null//this.hasErrors()

        return <form method={'post'} className='user-profile' autoComplete="on" onSubmit={this.signup}>

            <H2>Login</H2>

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
                        errors['password'] && <span className="icon is-medium is-right">
                            <i className="fas fa-exclamation-triangle"></i>
                        </span>
                    }
                </div>
                <p className="bu-help bu-is-danger">{errors['password']}</p>
            </div>

            <div className='bu-buttons margin-top-40'>
                <NiceButton  type='submit' disabled={hasErrors} intent={'info'} large="true" text="Login" />
            </div>

        </form>
    }
}