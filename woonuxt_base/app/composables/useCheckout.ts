import type { CheckoutInput, UpdateCustomerInput, CreateAccountInput } from '#gql';
import axios from 'axios';
import https from 'https';

export function useCheckout() {
  const orderInput = useState<any>('orderInput', () => {
    return {
      customerNote: '',
      paymentMethod: '',
      shipToDifferentAddress: false,
      metaData: [{ key: 'order_via', value: 'WooNuxt' }],
    };
  });

  const isProcessingOrder = useState<boolean>('isProcessingOrder', () => false);

  // if Country or State are changed, calculate the shipping rates again
  async function updateShippingLocation() {
    const { customer, viewer } = useAuth();
    const { isUpdatingCart, refreshCart } = useCart();

    isUpdatingCart.value = true;

    try {
      const { updateCustomer } = await GqlUpdateCustomer({
        input: {
          id: viewer?.value?.id,
          shipping: orderInput.value.shipToDifferentAddress ? customer.value.shipping : customer.value.billing,
          billing: customer.value.billing,
        } as UpdateCustomerInput,
      });

      if (updateCustomer) refreshCart();
    } catch (error) {
      console.error(error);
    }
  }

  function openPayPalWindow(redirectUrl: string): Promise<boolean> {
    return new Promise((resolve) => {
      const width = 750;
      const height = 750;
      const left = window.innerWidth / 2 - width / 2;
      const top = window.innerHeight / 2 - height / 2 + 80;
      const payPalWindow = window.open(redirectUrl, '', `width=${width},height=${height},top=${top},left=${left}`);
      const timer = setInterval(() => {
        if (payPalWindow?.closed) {
          clearInterval(timer);
          resolve(true);
        }
      }, 500);
    });
  }

  function opentelepayWindow(redirectUrl: string): Promise<boolean> {
    return new Promise((resolve) => {
      const width = 750;
      const height = 750;
      const left = window.innerWidth / 2 - width / 2;
      const top = window.innerHeight / 2 - height / 2 + 80;
      const telepayWindow = window.location.replace(redirectUrl);
      const timer = setInterval(() => {
        /* if (telepayWindow?) {
          clearInterval(timer);
          resolve(true);
        } */
      }, 500);
    });
  }

  const proccessCheckout = async (isPaid = false) => {
    const { customer, loginUser } = useAuth();
    const router = useRouter();
    const { replaceQueryParam } = useHelpers();
    const { emptyCart, refreshCart } = useCart();

    isProcessingOrder.value = true;

    const { username, password, shipToDifferentAddress } = orderInput.value;
    const billing = customer.value?.billing;
    const shipping = shipToDifferentAddress ? customer.value?.shipping : billing;

    try {
      let checkoutPayload: CheckoutInput = {
        billing,
        shipping,
        metaData: orderInput.value.metaData,
        paymentMethod: orderInput.value.paymentMethod.id,
        customerNote: orderInput.value.customerNote,
        shipToDifferentAddress,
        transactionId: orderInput.value.transactionId,
        isPaid,
      };

      // Create account
      if (orderInput.value.createAccount) {
        checkoutPayload.account = { username, password } as CreateAccountInput;
      }

      const { checkout } = await GqlCheckout(checkoutPayload);

      // Login user if account was created during checkout
      if (orderInput.value.createAccount) {
        await loginUser({ username, password });
      }

      const orderId = checkout?.order?.databaseId;
      const orderKey = checkout?.order?.orderKey;
      const orderInputPaymentId = orderInput.value.paymentMethod.id;
      const isPayPal = orderInputPaymentId === 'paypal' || orderInputPaymentId === 'ppcp-gateway';
      const isTeleBirr = orderInputPaymentId === 'cheque';
      
      //TeleBirr Payment
      if(isTeleBirr){
        isProcessingOrder.value = false;

        /* let data = JSON.stringify({
          "appSecret": "fad0f06383c6297f545876694b974599"
        });
        
        let config = {
          method: 'post',
          maxBodyLength: Infinity,
          url: 'https://196.188.120.3:38443/apiaccess/payment/gateway/payment/v1/token',
          headers: { 
            'X-APP-Key': 'c4182ef8-9249-458a-985e-06d191f4d505', 
            'Content-Type': 'application/json'
          },
          httpsAgent: new https.Agent({
            rejectUnauthorized: false
          }),
          data : data
        };
        
        axios.request(config)
        .then((response) => {
          console.log("response")
          console.log(response)
          alert(JSON.stringify(response));
        })
        .catch((error) => {
          alert(error);
        }); */
        window.handleinitDataCallback = function () {
          window.location.href = window.location.origin;
        };
        
       // let loading = weui.loading("loading", {});
       let telepay = await window
          .fetch("http://localhost:8081" + "/create/order", {
            method: "post",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              title: "diamond_" + "50",
              amount: "50" + "",
            }),
          })
          .then((res) => {
          console.log("res");
          console.log(res);
          alert({res});
            res
              .text()
              .then(async (rawRequest) => {
            console.log("rawRequest");
            console.log(rawRequest.trim());
                let obj = JSON.stringify({
                  functionName: "js_fun_start_pay",
                  params: {
                    rawRequest: rawRequest.trim(),
                    functionCallBackName: "handleinitDataCallback",
                  },
                });
      
                if (typeof rawRequest === undefined || rawRequest === null) return;
                if (window.consumerapp === undefined || window.consumerapp === null) {
                  const istelepayWindowClosed = await opentelepayWindow(rawRequest.trim());
                  console.log("This is not opened in app!");
                  return;
                }
                window.consumerapp.evaluate(obj);
              })
              .catch((error) => {
                console.log("error occur", error);
              })
              .finally(() => {});
          })
          .finally(() => {
            //loading.hide();
          });
        //startPay();
        console.log(telepay);
        alert('You payed using TeleBirr');
      return null;
      }

      // PayPal redirect
      if ((await checkout?.redirect) && isPayPal) {
        const frontEndUrl = window.location.origin;
        let redirectUrl = checkout?.redirect ?? '';

        const payPalReturnUrl = `${frontEndUrl}/checkout/order-received/${orderId}/?key=${orderKey}&from_paypal=true`;
        const payPalCancelUrl = `${frontEndUrl}/checkout/?cancel_order=true&from_paypal=true`;

        redirectUrl = replaceQueryParam('return', payPalReturnUrl, redirectUrl);
        redirectUrl = replaceQueryParam('cancel_return', payPalCancelUrl, redirectUrl);
        redirectUrl = replaceQueryParam('bn', 'WooNuxt_Cart', redirectUrl);

        const isPayPalWindowClosed = await openPayPalWindow(redirectUrl);

        if (isPayPalWindowClosed) {
          router.push(`/checkout/order-received/${orderId}/?key=${orderKey}&fetch_delay=true`);
        }
      } else {
        router.push(`/checkout/order-received/${orderId}/?key=${orderKey}`);
      }

      if ((await checkout?.result) !== 'success') {
        alert('There was an error processing your order. Please try again.');
        window.location.reload();
        return checkout;
      } else {
        await emptyCart();
        await refreshCart();
      }
    } catch (error: any) {
      isProcessingOrder.value = false;

      const errorMessage = error?.gqlErrors?.[0].message;

      if (errorMessage?.includes('An account is already registered with your email address')) {
        alert('An account is already registered with your email address');
        return null;
      }

      alert(errorMessage);
      return null;
    }

    isProcessingOrder.value = false;
  };

  return {
    orderInput,
    isProcessingOrder,
    proccessCheckout,
    updateShippingLocation,
  };
}
