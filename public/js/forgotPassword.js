import axios from 'axios';
import { showAlert } from './alerts';

export async function forgotPassword(email) {
  try {
    const res = await axios({
      method: 'POST',
      url: '/api/v1/users/forgotPassword',
      data: {
        email,
      },
    });
    if (res.data.status === 'success') {
      showAlert(
        'success',
        'A mail sent into your inbox with the link to reset your password'
      );
      window.setTimeout(() => {
        location.assign('/');
      }, 1500);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
}

export async function resetPassword(password, passwordConfirm) {
  const arr = window.location.href.split('/');
  const resetToken = arr[arr.length - 1];
  try {
    const res = await axios({
      method: 'POST',
      url: `/api/v1/users/resetPassword/${resetToken}`,
      data: {
        password,
        passwordConfirm,
      },
    });
    if (res.data.status === 'success') {
      showAlert(
        'success',
        'A mail sent into your inbox with the link to reset your password'
      );
      window.setTimeout(() => {
        location.assign('/');
      }, 1500);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
}
