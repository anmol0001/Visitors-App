const express= require('express');
const router= express.Router();
const otpGenerator = require('otp-generator')
const sqMail=require('@sendgrid/mail');
const visitor=require('../model/visitor');

if(process.env.NODE_ENV !== 'production')
   require('dotenv').config();

const API_KEY = process.env.MY_API_KEY;

sqMail.setApiKey(API_KEY);


router.get('/',(req,res)=>{
    res.render('index.ejs');
})


router.get('/checkin',(req,res)=>{
    let message=req.flash('info');
    // console.log(message);
    res.render('checkin.ejs',{msg:message});
})




router.post('/checkin',async(req,res)=>{
    const data = {
        ...req.body
    }
    let otp=otpGenerator.generate(6, {alphabets:false, upperCase: false, specialChars: false });
    let date= await getDate();
    
   var d= await visitor.create({
        username:data.username,
        email:data.email,
        purpose:data.purpose,
        otp:otp,
        isOtpMatched:false,
        Date:date
    });

    let msg=`<h1>Hi, ${data.username}</h1> <h1 style="color:red">Your OTP is = ${otp}</h1>`;

    sendMail(data.email,msg);

    res.redirect(`/verify?id=${d._id}`);
})

router.get('/checkout',(req,res)=>{
    let message=req.flash('info');
    // console.log(message);
    res.render('checkout.ejs',{msg:message});
})


router.post('/checkout',async(req,res)=>{
    const data = {
        ...req.body
    }


    await visitor.findById({_id:data.visitor_id.trim()})
        .then(async(result)=>{
             let time= await getTime();
            if((result.checkOut_Time === "-") || (result.checkOut_Time === null)){ 
            await visitor.findByIdAndUpdate({_id:result.id},{checkOut_Time:time});
            let msg=`<h2>Hi, ${result.username}</h2> <h3>Visitor Id is:- ${result._id} </h3> <h3>Your CheckIn Time is:- ${result.checkIn_Time} </h3> <h3>Your CheckOut Time is:- ${time}</h3> `;
            sendMail(result.email,msg);
            res.render('matched.ejs',{w:"Check Out"});
            }
            else{
                req.flash('info', "Id and Name Doesn't Matched ");
                res.redirect('/checkout');  
            }
        })

        .catch((err)=>{
                        req.flash('info', "Id and Name Doesn't Matched ");
                        res.redirect('/checkout');  
        })
    
})




router.get('/verify',async(req,res)=>{
    res.render('otpPage.ejs',{id:req.query.id});

})


router.get('/matched',(req,res)=>{
    res.render('matched.ejs',{w:req.query.w});
})


router.post('/verify',async(req,res)=>{

    const getOtp=req.body.otp;
    const id=req.query.id;
    const getvisitor=await visitor.findById({_id:id});
    if(getOtp === getvisitor.otp){
        let time= await getTime();
        let result=await visitor.findByIdAndUpdate({_id:id},{checkIn_Time:time,isOtpMatched:true});
        let msg=`<h1>Hi, ${result.username}</h1> <h2>Your Visitor Id is:- ${id}</h2> <h2>Your CheckIn Time is:- ${time}</h2> <h3 style="color:red"> Note:- Save Visitior Id for later </h3>`;
        sendMail(result.email,msg);
        res.redirect(`/matched?w=${"Check In"}`);
    }
    else{
        req.flash('info', "OTP doesn't matched try again");
        await visitor.findByIdAndDelete({_id:id});
        res.redirect('/checkin');
    }
})


router.get('/Enqury',async(req,res)=>{
    let date=getDate();
    let response=await visitor.find({Date:date,$and:[{isOtpMatched:true}]})
    res.render('enqury.ejs',{response:response,date:date});

})

router.get('/getData',async(req,res)=>{
    let date=req.query.date;
    let splitDate=date.split("-");
    date=splitDate[2]+"-"+splitDate[1]+"-"+splitDate[0];
    await visitor.find({Date:date,$and:[{isOtpMatched:true}]})
    .then((result)=>{
        if(result.length==0){
            res.render('notFound.ejs',{date:date});
        }
        else{
            res.render('enqury.ejs',{response:result,date:date});
        }

        res.send(result);
    })
   .catch((err)=>{
       //console.log(err.message);
   });

})

router.post('/resend',async(req,res) =>{
    const id=req.query.id;
    const getvisitor=await visitor.findById({_id:id});
    
    let otp=otpGenerator.generate(6, {alphabets:false, upperCase: false, specialChars: false });

    let msg=`<h1>Hi, ${getvisitor.username}</h1> <h1 style="color:red">Your OTP is = ${otp}</h1>`;
     
    await visitor.findByIdAndUpdate({_id:id},{otp:otp});
 
    sendMail(getvisitor.email,msg);

    // res.render('otpPage.ejs',{id:req.query.id});
    res.redirect(`/verify?id=${id}`);

});


async function sendMail(email,msg){                 
    const message={
        to:`${email}`,
        from:'anmoljindal.aj.456@gmail.com',
        subject: 'Visitor App',
        // text: `${msg}`,
        html: `<strong>${msg}</strong>`
    };
    await sqMail.send(message)
    .then((response)=>{
        console.log('Email is Send');
    })
    .catch((err)=>{console.log(err)})
}



function getTime(){
    let dt=new Date();
    let hrs=dt.getHours();
    let min=dt.getMinutes();
    let sec=dt.getSeconds();
    let time=hrs+":"+min+":"+sec;
    return time;
}



function getDate(){
    let dt=new Date();
    let date=("0"+dt.getDate()).slice(-2);
    let month=("0"+(dt.getMonth()+1)).slice(-2);
    let year=dt.getFullYear();
    let d=date+"-"+month+"-"+year;
    return d;
}

module.exports= router;
