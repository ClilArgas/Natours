/* esling-disable */
import axios from 'axios';
import { showAlert } from './alerts';
const stripe = Stripe(
  'pk_test_51K6CZoGuTkj7NYP9o5xIXPnXOgpblFAac8PO25aIkdFhHqdoaDZldPQMBDl8H91N9QEkVTk2BEAX7RpbyyhzbHtZ00L6mh8OFJ'
);

export const bookTour = async (tourId) => {
  try {
    //1)get the session from the server
    const session = await axios(`/api/v1/bookings/checkout-session/${tourId}`);
    // console.log(session);
    //2)create checkoutform + chagre the credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (err) {
    console.log(err);
    showAlert('error', 'Tour is fully booked');
  }
};
