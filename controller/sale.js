const { validationResult } = require("express-validator");
const { Place } = require("../model/place");
const { Sale } = require("../model/sales");
const { Category } = require("../model/category");
const { User } = require("../model/user");
var nodemailer = require("nodemailer");
const stripe = require("stripe")(`${process.env.STRIPE_SECRET_KEY}`);

exports.addSale = async (req, res, next) => {
  const errors = validationResult(req);

  try {
    if (!errors.isEmpty()) {
      const error = new Error("Rezervare esuata!");
      error.statusCode = 422;
      error.data = errors.array();
      throw error;
    }

    const place = await Place.findById(req.body.placeId);

    if (Date.parse(req.body.data_start) > Date.parse(req.body.data_end)) {
      const error = new Error(
        "Data de plecare trebuie sa fie mai mare decat data sosirii!"
      );
      error.statusCode = 401;
      throw error;
    }

    if (!place) {
      const error = new Error("There is no place for this id");
      error.statusCode = 401;
      throw error;
    }

    const sales = await Sale.find({ place: place._id });

    let date_begin = new Date(req.body.data_start);
    let date_end = new Date(req.body.data_end);

    sales.map((sale) => {
      const ds = new Date(sale.data_start);
      const de = new Date(sale.data_end);
      const ds_req = new Date(req.body.data_start);
      const de_req = new Date(req.body.data_end);

      if (
        (ds_req.getTime() <= ds.getTime() && de_req.getTime() > de.getTime()) ||
        (ds_req.getTime() <= ds.getTime() &&
          de_req.getTime() < de.getTime() &&
          de_req.getTime() > ds.getTime()) ||
        (ds_req.getTime() >= ds.getTime() &&
          ds_req.getTime() < de.getTime() &&
          de_req.getTime() > ds.getTime())
      ) {
        const error = new Error("Perioada solicitata este ocupata");
        error.statusCode = 401;
        throw error;
      }
    });

    let differenceInTime = date_end.getTime() - date_begin.getTime();

    let differenceInDays = Math.round(differenceInTime / (1000 * 3600 * 24));

    let user = await User.findById(req.userId);

    let sale = new Sale({
      client: req.userId,
      place: req.body.placeId,
      owner: place.owner,
      data_start: req.body.data_start,
      data_end: req.body.data_end,
      price: differenceInDays * place.price,
      nume: req.body.nume,
      adresa: req.body.adresa,
      telefon: req.body.telefon,
      pay_type: req.body.pay_type,
    });
    await sale.save();

    var transporter = nodemailer.createTransport({
      host: "smtp-relay.brevo.com",
      port: 587,
      secure: false, // upgrade later with STARTTLS
      auth: {
        user: "cornel.siclovan@gmail.com",
        pass: process.env.BREVO_API_KEY,
      },
    });

    var mailOptions = {
      from: "cornel.siclovan@gmail.com",
      to: user.email,
      subject: "Rezervarea dumneavoastra",
      text: `Ati rezervat locatia ${place.title} de la adresa ${place.tara}, ${place.oras}, ${place.strada}. Perioada rezervarii dvs. este ${sale.data_start} - ${sale.data_end}. Totalul platit este suma de ${sale.price}.`,
    };

    try {
      transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          console.log(error);
        } else {
          console.log("Email sent: " + info.response);
        }
      });
    } catch (err) {
      console.log(err);
    }

    res.status(200).send(sale);
  } catch (error) {
    next(error);
  }
};

exports.getSalesByUserId = async (req, res, next) => {
  try {
    const reservations = await Sale.find({ client: req.userId });
    let rezvToSend = await Promise.all(
      reservations.map(async (rezv) => {
        let place = await Place.findById(rezv.place);
        let category = await Category.findById(place.category);
        let owner = await User.findById(place.owner);

        return {
          _id: rezv._id,
          place: place.title,
          data_start: rezv.data_start,
          data_end: rezv.data_end,
          suprafata: place.suprafata,
          tara: place.tara,
          oras: place.oras,
          judet: place.judet,
          strada: place.strada,
          currency: place.currency || "",
          category: category.title,
          image: place.image,
          price: rezv.price,
          owner: owner.name,
          rating: rezv.rating || 0,
          comment: rezv.comment,
        };
      })
    );

    res.status(200).send({ reservations: rezvToSend });
  } catch (error) {
    next(error);
  }
};

exports.getClientsByOwnerId = async (req, res, next) => {
  try {
    const place = await Place.findById();

    const reservations = await Sale.find({ owner: req.userId });

    let rezvToSend = await Promise.all(
      reservations.map(async (rezv) => {
        let place = await Place.findById(rezv.place);
        let category = await Category.findById(place.category);
        let client = await User.findById(rezv.client);
        console.log;
        return {
          _id: rezv._id,
          place: place.title,
          data_start: rezv.data_start,
          data_end: rezv.data_end,
          suprafata: place.suprafata,
          tara: place.tara,
          oras: place.oras,
          judet: place.judet,
          strada: place.strada,
          price: rezv.price || "",
          currency: place.currency || "",
          category: category.title,
          image: place.image,
          client: client.name,
          rating: rezv.rating || 0,
          comment: rezv.comment,
        };
      })
    );

    console.log(rezvToSend);
    res.status(200).send({ reservations: rezvToSend });
  } catch (error) {
    next(error);
  }
};

exports.rateSale = async (req, res, next) => {
  const saleId = req.params.saleId;
  const errors = validationResult(req);

  try {
    if (!errors.isEmpty()) {
      const error = new Error("Rezervare esuata!");
      error.statusCode = 422;
      error.data = errors.array();
      throw error;
    }

    const sale = await Sale.findById(saleId);

    if (!sale) {
      const error = new Error("Rating esuat!");
      error.statusCode = 422;
      throw error;
    }

    if (sale.client != req.userId) {
      const error = new Error("Aceasta nu este rezervarea dvs!");
      error.statusCode = 422;
      throw error;
    }

    sale.rating = req.body.rating;

    await sale.save();

    res.status(200).send(sale);
  } catch (error) {
    next(error);
  }
};

exports.giveComment = async (req, res, next) => {
  const saleId = req.params.saleId;
  const errors = validationResult(req);
  const userId = req.userId;

  try {
    if (!errors.isEmpty()) {
      const error = new Error("Comment esuat!");
      error.statusCode = 422;
      error.data = errors.array();
      throw error;
    }

    const sale = await Sale.findById(saleId);

    if (sale.client != req.userId) {
      const error = new Error("Aceasta nu este rezervarea dvs!");
      error.statusCode = 422;
      throw error;
    }

    if (!sale) {
      const error = new Error("Aceasta rezervare nu exista");
      error.statusCode = 422;
      throw error;
    }

    sale.comment = req.body.comment;

    await sale.save();

    res.status(200).send(sale);
  } catch (error) {
    next(error);
  }
};

exports.postPayment = async (req, res, next) => {
  let {amount, id} = req.body;
  const amountInCents = Math.round(amount*100);
  try {
		const payment = await stripe.paymentIntents.create({
			amount:amountInCents,
			currency: "USD",
			description: "Booking company",
			payment_method: id,
			confirm: true,
      return_url: "http://localhost:8000/"
		})
    
		res.json({
			message: "Payment successful",
			success: true
		})
	} catch (error) {
		console.log("Error", error)
		res.json({
			message: "Payment failed",
			success: false
		})
	}
}