const socket = io();

const fetchData = (url, callback) => {
    fetch(url)
    .then(res => {
        if(!res.ok){
            throw Error("Something went wrong");
        }

        return res.json();
    })
    .then(callback)
    .catch(err => console.log(err.message))
}

socket.on("error", (errorMessage) => {
    window.location.href = "http://localhost:5000/games?error=" + errorMessage
})