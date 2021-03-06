const db = require('../knex');
const API_URL = process.env.GOOGLE_API_URL;
const API_KEY = process.env.GOOGLE_API_KEY;
const fetch = require('node-fetch');

const restaurantFields = {
  name: 'name',
  rating: 'rating',
  hoursOfOperation: 'opening_hours/weekday_text',
  openNow: 'opening_hours/open_now',
  address: 'formatted_address',
  phoneNumber: 'formatted_phone_number',
  website: 'website'
}

const fields = Object.values(restaurantFields);

exports.list = async (req, res, next) => {
  try {
    let restaurants = await db('restaurants').select('id', 'place_id');

    const { name, rating, hoursOfOperation, openNow, ...rest } = restaurantFields;
    const listFields = [name, rating, hoursOfOperation, openNow];

    let serializedRestaurants = []
    for (let restaurant of restaurants) {
      const json = await exports.fetchApi(listFields.join(","), restaurant.place_id)
      restaurant = {
        ...restaurant,
        ...json.result
      }
      serializedRestaurants = [...serializedRestaurants, exports.serializeRestaurant(restaurant)]
    }
    serializedRestaurants.sort((a,b) => b.rating - a.rating)
    res.json({ restaurants: serializedRestaurants })
  } catch (e) {
    next(e)
  }
}

exports.getRestaurantById = async (req, res, next) => {
  try {
    let [restaurant] = await db('restaurants').select('id','place_id').where('id', req.params.restaurantId);
    const json = await exports.fetchApi(fields.join(","), restaurant.place_id)
    restaurant = {
      ...restaurant,
      ...json.result
    }
    res.json(exports.serializeRestaurant(restaurant))
  } catch (e) {
    console.log(e)
    next(e)
  }
}

exports.fetchApi = async (fields, place_id) => {
  const url = exports.urlBuilder(fields, place_id);
  const response = await fetch(url);
  return await response.json();
}

exports.urlBuilder = (fields, place_id) => {
  return `${API_URL}/maps/api/place/details/json?place_id=${place_id}&fields=${fields}&key=${API_KEY}`
}

exports.serializeRestaurant = (
  {
    id,
    name,
    opening_hours,
    rating,
    formatted_address,
    formatted_phone_number,
    website
  }) => {
  return {
    id: id ? id : null,
    name: name ? name : null,
    openNow: opening_hours ? opening_hours["open_now"] : null,
    hoursOfOperation: opening_hours ? opening_hours["weekday_text"] : null,
    rating: rating ? rating : null,
    address: formatted_address ? formatted_address : null,
    phoneNumber: formatted_phone_number ? formatted_phone_number : null,
    website: website ? website : null
  }
}