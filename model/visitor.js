const mongoose = require('mongoose');
const visitorSchema=new mongoose.Schema({
    username:{
        type:String,
        trim:true,
        required:true,
    },
    email:{
        type:String,
        trim:true,
        required:true,
    },
    purpose:{
        type:String,
        trim:true,
    },
    checkIn_Time:{
        type:String,
        trim:true,
        default:'-',
    },
    otp:{
        type:String,
    },
    isOtpMatched:{
        type:Boolean,
        require:true,
    },
    checkOut_Time:{
        type:String,
        trim:true,
        default:'-',
    },
    Date:{
        type:String,
        require:true,

    }
    
})



const Visitor = mongoose.model('Visitor', visitorSchema);

module.exports = Visitor;