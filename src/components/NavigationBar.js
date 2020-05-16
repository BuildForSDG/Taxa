import React from 'react';
import Login from './Login';

const NavigationBar = () => {
    return (
        <div>
            <nav class="navbar navbar-default navbar-fixed-top">
                <div class="container">
                    <div class="navbar-header">
                    <button class="navbar-toggle" type="button" name="button" data-toggle="collapse" data-target="navbar-top">
                        <i class="fa fa-bars" araia-hidden="true"></i>
                    </button>
                    <div class="collapse navbar-collapse" id="navbar-top">
                        <ul class="nav navbar-nav navbar-right">
                        {/* eslint-disable-next-line  */}
                                <li><a href="#about"></a>About</li>
                        {/* eslint-disable-next-line  */}
                                <li><a href={Login} data-toggle="modal" data-target={Login}></a>Sign In</li>
                        {/* eslint-disable-next-line  */}
                        <li><a href="#contact-us"></a>Contact Us</li>
                        </ul>
                    </div>
                    </div>
                </div>
            </nav>
        </div>
    )
};

export default NavigationBar;
