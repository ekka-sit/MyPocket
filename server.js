const { text } = require("body-parser")
const express = require("express")
const path = require("path")
const PORT = process.env.PORT || 5000

const app = express()
app.use(express.static(path.join(__dirname, "public")))

app.listen(PORT, () => {
    console.log(`run at port ${PORT}`)
})