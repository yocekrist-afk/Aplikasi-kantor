type ConfirmCallback = (result: boolean) => void;

let confirmCallback: ConfirmCallback | null = null;
let currentMessage: string = '';

export const confirmAction = (message: string): Promise<boolean> => {
  return new Promise((resolve) => {
    currentMessage = message;
    confirmCallback = resolve;
    window.dispatchEvent(new Event('show-confirm-modal'));
  });
};

export const getConfirmState = () => ({
  message: currentMessage,
  resolve: (result: boolean) => {
    if (confirmCallback) {
      confirmCallback(result);
      confirmCallback = null;
    }
  }
});
