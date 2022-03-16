const toast = document.getElementById("toast")
const toastMessage = document.getElementById("toast-message")
const closeToast = document.getElementById("close-toast");

closeToast.addEventListener("click", () => {
    toast.classList.add('hidden')
})

const setToastType = (type) => {
    if(type === 'success'){
        toast.classList.add('success')
    }else{
        toast.classList.remove('success')
    }
}

const displayToast = (message) => {
    toastMessage.innerText = message;

    toast.classList.remove("hidden")

    setTimeout(() => {
        toast.classList.add("hidden")
    }, 2000)
}