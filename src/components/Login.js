import React from 'react';

const Login = () => {
    return (
        <div class="modal fade" id="login-form" tabindex="-1" role="dialog" aria-labelledby="modal-label" aria-hidden="true">
            <div class="modal-dialog" role="document">
                <div class="modal-content">
                    <div class="modal-header text-center">
                        <h4 class="modal-title">Sign In</h4>
                        <button type="button" class="close" data-dismiss="modal" aria-label="close" name="button">
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </div>
                    <div class="modal-body mx-3">
                        <div class="md-form mb-5">
                            <i class="fa fa-envelop prefix grey-text"></i>
                            <label data-error="wrong" data-success="right" for="login-email">Your Email</label>
                            <input type="email" id="login-email" class="form-control validate"></input>
                        </div>
                        <div class="md-form mb-5">
                            <i class="fa fa-lock prefix grey-text"></i>
                            <label data-error="wrong" data-success="right" for="login-password">Your Password</label>
                            <input type="password" id="login-password" class="form-control validate"></input>
                        </div>
                    </div>
                    <div class="modal-footer d-flex justify-content-center">
                        <button type="button" class="btn btn-default">Login</button>
                    </div>
                </div>
            </div>
      </div>
    )
};

export default Login;
