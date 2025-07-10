(async function(){
    const signup = async () =>{
    const response = await fetch("http://localhost:5219/usuarios/12", {
        method : 'PUT',
        headers: {
        "Content-Type": "application/x-www-form-urlencoded",
  },
    body: new URLSearchParams({         
        user : 'Prueba',
        pword : 'Prueba123',
        email : "Prueba@prueba.com" }),

    })
    const data = response.json()
    console.log(data)
    return data
}
    await signup()
})()