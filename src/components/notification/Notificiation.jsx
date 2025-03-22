import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Notification = () => {
  return (
    <ToastContainer
      position="top-right"
      autoClose={3000}
      hideProgressBar
      newestOnTop={false}
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme="dark"
      toastClassName="!bg-gray-700 !rounded-lg !border !border-gray-700 !shadow-xl !mb-3 !max-w-[300px] md:!max-w-[300px] !text-sm"
      bodyClassName="!p-0 !m-0"
      style={{
        fontFamily: "'Inter', sans-serif",
        width: "auto",
      }}
    />
  );
};

// Success Notification
export const notifySuccess = (message) => toast.success(message, {
  className: "!bg-gray-900 !border-blue-500/30 !shadow-blue-500/10",
  icon: (
    <div className="w-6 h-6 flex items-center justify-center mr-3">
      <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
      </svg>
    </div>
  ),
  body: () => (
    <div className="flex items-center text-gray-100">
      <span className="font-medium">{message}</span>
    </div>
  )
});

// Error Notification
export const notifyError = (message) => toast.error(message, {
  className: "!bg-gray-900 !border-red-500/30 !shadow-red-500/10",
  icon: (
    <div className="w-6 h-6 flex items-center justify-center mr-3">
      <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
      </svg>
    </div>
  ),
  body: () => (
    <div className="flex items-center text-gray-100">
      <span className="font-medium">{message}</span>
    </div>
  )
});

// New Message Notification
export const notifyMessage = (sender, message) => toast.info(
  <div className="flex flex-col">
    <span className="font-medium text-blue-400">{sender}</span>
    <span className="text-gray-300 text-sm mt-1">{message}</span>
  </div>, 
  {
    className: "!bg-gray-900 !border-indigo-500/30 !shadow-indigo-500/10",
    icon: (
      <div className="w-6 h-6 flex items-center justify-center mr-3">
        <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
        </svg>
      </div>
    ),
    autoClose: 5000,
    position: "bottom-right"
  }
);

export default Notification;