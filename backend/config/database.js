// Stay Nestura Properties Management System
// In-Memory Database for Demo/Testing

const { v4: uuidv4 } = require('uuid') || { v4: () => 'id-' + Math.random().toString(36).substr(2, 9) };

// Simple ID generator
let idCounter = 500;
const nextId = () => ++idCounter;

// ============ IN-MEMORY DATA STORES ============

const store = {
  properties: [
    { id: 1, name: 'Torna by Stay Nestura', property_type: 'Bungalow - 4 BHK', address: 'Near Torna Fort', city: 'Velhe', state: 'Maharashtra', pincode: '412212', total_rooms: 2, max_guests: 6, base_price: 3500, description: 'Stay Nestura property near Torna Fort with stunning mountain views, home-cooked meals and trekking access', amenities: ['WiFi', 'Parking', 'Kitchen', 'Mountain View'], images: [], latitude: 18.2769, longitude: 73.6131, google_maps_link: '', is_active: true, created_at: '2024-01-15T00:00:00Z', updated_at: '2024-01-15T00:00:00Z' },
    { id: 2, name: 'Shivneri by Stay Nestura', property_type: 'Bungalow - 2 BHK', address: 'Near Shivneri Fort', city: 'Junnar', state: 'Maharashtra', pincode: '410502', total_rooms: 2, max_guests: 4, base_price: 2500, description: 'Stay Nestura property near Shivneri Fort with valley views, breakfast included and fort trekking nearby', amenities: ['WiFi', 'Parking', 'Breakfast'], images: [], latitude: 19.2094, longitude: 73.8567, google_maps_link: '', is_active: true, created_at: '2024-01-20T00:00:00Z', updated_at: '2024-01-20T00:00:00Z' },
    { id: 3, name: 'Solapur Homestay 2 by Stay Nestura', property_type: 'Bungalow - 2 BHK', address: 'City Center', city: 'Solapur', state: 'Maharashtra', pincode: '413001', total_rooms: 1, max_guests: 3, base_price: 1800, description: 'Stay Nestura property in Solapur city center, comfortable homestay with AC, WiFi and TV', amenities: ['WiFi', 'AC', 'TV'], images: [], latitude: 17.6599, longitude: 75.9064, google_maps_link: '', is_active: true, created_at: '2024-02-01T00:00:00Z', updated_at: '2024-02-01T00:00:00Z' },
    { id: 4, name: 'Solapur Homestay 1 by Stay Nestura', property_type: 'Bungalow - 1 BHK', address: 'Station Road', city: 'Solapur', state: 'Maharashtra', pincode: '413001', total_rooms: 1, max_guests: 2, base_price: 1200, description: 'Stay Nestura property near Solapur railway station, budget-friendly with WiFi and TV', amenities: ['WiFi', 'TV'], images: [], latitude: 17.6599, longitude: 75.9064, google_maps_link: '', is_active: true, created_at: '2024-02-10T00:00:00Z', updated_at: '2024-02-10T00:00:00Z' },
    { id: 5, name: 'Single Room Twin Sharing by Stay Nestura', property_type: 'Single Room', address: 'MG Road', city: 'Solapur', state: 'Maharashtra', pincode: '413001', total_rooms: 1, max_guests: 2, base_price: 800, description: 'Stay Nestura single room with twin sharing, budget-friendly with basic amenities', amenities: ['WiFi', 'Fan'], images: [], latitude: 17.6599, longitude: 75.9064, google_maps_link: '', is_active: true, created_at: '2024-03-01T00:00:00Z', updated_at: '2024-03-01T00:00:00Z' },
    { id: 6, name: 'Deluxe Room by Stay Nestura', property_type: 'Single Room', address: 'FC Road', city: 'Solapur', state: 'Maharashtra', pincode: '413001', total_rooms: 1, max_guests: 2, base_price: 1100, description: 'Stay Nestura deluxe room with AC, TV, mini fridge and extra comfort', amenities: ['WiFi', 'AC', 'TV', 'Mini Fridge'], images: [], latitude: 17.6599, longitude: 75.9064, google_maps_link: '', is_active: true, created_at: '2024-03-05T00:00:00Z', updated_at: '2024-03-05T00:00:00Z' },
  ],
  guests: [
    { id: 201, first_name: 'Amar', last_name: 'Dhole', email: '', phone: '1234567890', id_proof_type: null, id_proof_number: null, id_proof_encrypted: null, address: '', date_of_birth: null, nationality: 'Indian', total_stays: 1, total_spent: 3750, lifetime_value: 3750, preferences: '', notes: '', created_at: '2026-03-17T19:15:48.317Z', updated_at: '2026-03-17T19:15:48.317Z' },
    { id: 301, first_name: 'Pradip', last_name: 'Krishen', email: '', phone: '', id_proof_type: null, id_proof_number: null, id_proof_encrypted: null, address: '', date_of_birth: null, nationality: 'Indian', total_stays: 1, total_spent: 3000, lifetime_value: 3000, preferences: '', notes: 'March 2026 register', created_at: '2026-03-01T00:00:00Z', updated_at: '2026-03-01T00:00:00Z' },
    { id: 302, first_name: 'Pratibha', last_name: 'Sant', email: '', phone: '', id_proof_type: null, id_proof_number: null, id_proof_encrypted: null, address: '', date_of_birth: null, nationality: 'Indian', total_stays: 1, total_spent: 3000, lifetime_value: 3000, preferences: '', notes: 'March 2026 register', created_at: '2026-03-03T00:00:00Z', updated_at: '2026-03-03T00:00:00Z' },
    { id: 303, first_name: 'Aruna', last_name: 'Chavan', email: '', phone: '', id_proof_type: null, id_proof_number: null, id_proof_encrypted: null, address: '', date_of_birth: null, nationality: 'Indian', total_stays: 1, total_spent: 4046, lifetime_value: 4046, preferences: '', notes: 'March 2026 register - online booking', created_at: '2026-03-04T00:00:00Z', updated_at: '2026-03-04T00:00:00Z' },
    { id: 304, first_name: 'Walk-in', last_name: 'Guest', email: '', phone: '', id_proof_type: null, id_proof_number: null, id_proof_encrypted: null, address: '', date_of_birth: null, nationality: 'Indian', total_stays: 1, total_spent: 4000, lifetime_value: 4000, preferences: '', notes: 'March 2026 register - offline', created_at: '2026-03-05T00:00:00Z', updated_at: '2026-03-05T00:00:00Z' },
    { id: 305, first_name: 'Viplav', last_name: 'Mhetras', email: '', phone: '', id_proof_type: null, id_proof_number: null, id_proof_encrypted: null, address: '', date_of_birth: null, nationality: 'Indian', total_stays: 1, total_spent: 2881, lifetime_value: 2881, preferences: '', notes: 'March 2026 register', created_at: '2026-03-07T00:00:00Z', updated_at: '2026-03-07T00:00:00Z' },
    { id: 306, first_name: 'Abhijeet', last_name: 'Shankar Lad', email: '', phone: '', id_proof_type: null, id_proof_number: null, id_proof_encrypted: null, address: '', date_of_birth: null, nationality: 'Indian', total_stays: 1, total_spent: 3500, lifetime_value: 3500, preferences: '', notes: 'March 2026 register', created_at: '2026-03-08T00:00:00Z', updated_at: '2026-03-08T00:00:00Z' },
    { id: 307, first_name: 'Hrushikesh', last_name: 'More', email: '', phone: '', id_proof_type: null, id_proof_number: null, id_proof_encrypted: null, address: '', date_of_birth: null, nationality: 'Indian', total_stays: 1, total_spent: 4500, lifetime_value: 4500, preferences: '', notes: 'March 2026 register', created_at: '2026-03-10T00:00:00Z', updated_at: '2026-03-10T00:00:00Z' },
    { id: 308, first_name: 'Vishu', last_name: 'Mukund Dhople', email: '', phone: '944', id_proof_type: null, id_proof_number: null, id_proof_encrypted: null, address: '', date_of_birth: null, nationality: 'Indian', total_stays: 1, total_spent: 3000, lifetime_value: 3000, preferences: '', notes: 'March 2026 register', created_at: '2026-03-11T00:00:00Z', updated_at: '2026-03-11T00:00:00Z' },
    { id: 309, first_name: 'Prasad', last_name: 'Purandare', email: '', phone: '9881157726', id_proof_type: null, id_proof_number: null, id_proof_encrypted: null, address: '', date_of_birth: null, nationality: 'Indian', total_stays: 1, total_spent: 5788, lifetime_value: 5788, preferences: '', notes: 'March 2026 register - Airbnb', created_at: '2026-03-12T00:00:00Z', updated_at: '2026-03-12T00:00:00Z' },
    { id: 310, first_name: 'Patil', last_name: 'Aditya', email: '', phone: '', id_proof_type: null, id_proof_number: null, id_proof_encrypted: null, address: '', date_of_birth: null, nationality: 'Indian', total_stays: 1, total_spent: 3575, lifetime_value: 3575, preferences: '', notes: 'March 2026 register', created_at: '2026-03-14T00:00:00Z', updated_at: '2026-03-14T00:00:00Z' },
    { id: 311, first_name: 'Satish', last_name: 'Bhanawat', email: '', phone: '9967457', id_proof_type: null, id_proof_number: null, id_proof_encrypted: null, address: '', date_of_birth: null, nationality: 'Indian', total_stays: 1, total_spent: 4040, lifetime_value: 4040, preferences: '', notes: 'March 2026 register - Booking.com', created_at: '2026-03-15T00:00:00Z', updated_at: '2026-03-15T00:00:00Z' },
    { id: 312, first_name: 'Satish', last_name: 'Chandwat D', email: '', phone: '', id_proof_type: null, id_proof_number: null, id_proof_encrypted: null, address: '', date_of_birth: null, nationality: 'Indian', total_stays: 1, total_spent: 3500, lifetime_value: 3500, preferences: '', notes: 'March 2026 register', created_at: '2026-03-16T00:00:00Z', updated_at: '2026-03-16T00:00:00Z' },
    { id: 313, first_name: 'Dhanajay', last_name: 'Suresh', email: '', phone: '9011529331', id_proof_type: null, id_proof_number: null, id_proof_encrypted: null, address: '', date_of_birth: null, nationality: 'Indian', total_stays: 1, total_spent: 3000, lifetime_value: 3000, preferences: '', notes: 'March 2026 register - both single rooms blocked by Amit', created_at: '2026-03-20T00:00:00Z', updated_at: '2026-03-20T00:00:00Z' },
  ],
  bookings: [
    { id: 202, property_id: 3, guest_id: 201, channel: 'direct', check_in: '2026-03-24', check_out: '2026-03-25', adults: 4, children: 0, infants: 0, nightly_rate: 3750, subtotal: 3750, cleaning_fee: 0, service_fee: 0, taxes: 0, gross_amount: 3750, commission_percent: 0, commission_amount: 0, net_amount: 3750, currency: 'INR', payment_status: 'partial', payment_method: 'UPI', paid_amount: 1500, pending_amount: 2250, booking_status: 'confirmed', guest_message: '', special_requests: '', check_in_time: '2:00 PM', check_out_time: '11:00 AM', actual_check_in: null, actual_check_out: null, confirmed_at: '2026-03-17T19:15:48.317Z', cancelled_at: null, created_at: '2026-03-17T19:15:48.317Z', updated_at: '2026-03-17T19:18:02.316Z' },
    { id: 401, property_id: 3, guest_id: 301, channel: 'direct', check_in: '2026-03-01', check_out: '2026-03-02', adults: 2, children: 0, infants: 0, nightly_rate: 3000, subtotal: 3000, cleaning_fee: 0, service_fee: 0, taxes: 0, gross_amount: 3000, commission_percent: 0, commission_amount: 0, net_amount: 3000, currency: 'INR', payment_status: 'paid', payment_method: 'UPI', paid_amount: 3000, pending_amount: 0, booking_status: 'checked_out', guest_message: '', special_requests: '', check_in_time: '2:00 PM', check_out_time: '11:00 AM', actual_check_in: null, actual_check_out: null, confirmed_at: '2026-03-01T00:00:00Z', cancelled_at: null, created_at: '2026-03-01T00:00:00Z', updated_at: '2026-03-01T00:00:00Z' },
    { id: 402, property_id: 3, guest_id: 302, channel: 'direct', check_in: '2026-03-03', check_out: '2026-03-04', adults: 2, children: 0, infants: 0, nightly_rate: 3000, subtotal: 3000, cleaning_fee: 0, service_fee: 0, taxes: 0, gross_amount: 3000, commission_percent: 0, commission_amount: 0, net_amount: 3000, currency: 'INR', payment_status: 'partial', payment_method: 'UPI', paid_amount: 1500, pending_amount: 1500, booking_status: 'checked_out', guest_message: '', special_requests: '', check_in_time: '2:00 PM', check_out_time: '11:00 AM', actual_check_in: null, actual_check_out: null, confirmed_at: '2026-03-03T00:00:00Z', cancelled_at: null, created_at: '2026-03-03T00:00:00Z', updated_at: '2026-03-03T00:00:00Z' },
    { id: 403, property_id: 3, guest_id: 303, channel: 'booking.com', check_in: '2026-03-04', check_out: '2026-03-05', adults: 2, children: 0, infants: 0, nightly_rate: 4046, subtotal: 4046, cleaning_fee: 0, service_fee: 0, taxes: 0, gross_amount: 4046, commission_percent: 15, commission_amount: 607, net_amount: 3439, currency: 'INR', payment_status: 'partial', payment_method: 'UPI', paid_amount: 4000, pending_amount: 46, booking_status: 'checked_out', guest_message: '', special_requests: '', check_in_time: '2:00 PM', check_out_time: '11:00 AM', actual_check_in: null, actual_check_out: null, confirmed_at: '2026-03-04T00:00:00Z', cancelled_at: null, created_at: '2026-03-04T00:00:00Z', updated_at: '2026-03-04T00:00:00Z' },
    { id: 404, property_id: 3, guest_id: 304, channel: 'direct', check_in: '2026-03-05', check_out: '2026-03-06', adults: 2, children: 0, infants: 0, nightly_rate: 4000, subtotal: 4000, cleaning_fee: 0, service_fee: 0, taxes: 0, gross_amount: 4000, commission_percent: 0, commission_amount: 0, net_amount: 4000, currency: 'INR', payment_status: 'paid', payment_method: 'UPI', paid_amount: 4000, pending_amount: 0, booking_status: 'checked_out', guest_message: '', special_requests: '', check_in_time: '2:00 PM', check_out_time: '11:00 AM', actual_check_in: null, actual_check_out: null, confirmed_at: '2026-03-05T00:00:00Z', cancelled_at: null, created_at: '2026-03-05T00:00:00Z', updated_at: '2026-03-05T00:00:00Z' },
    { id: 405, property_id: 3, guest_id: 305, channel: 'direct', check_in: '2026-03-07', check_out: '2026-03-08', adults: 5, children: 0, infants: 0, nightly_rate: 2881, subtotal: 2881, cleaning_fee: 0, service_fee: 0, taxes: 0, gross_amount: 2881, commission_percent: 0, commission_amount: 0, net_amount: 2881, currency: 'INR', payment_status: 'paid', payment_method: 'UPI', paid_amount: 2881, pending_amount: 0, booking_status: 'checked_out', guest_message: '', special_requests: '', check_in_time: '2:00 PM', check_out_time: '11:00 AM', actual_check_in: null, actual_check_out: null, confirmed_at: '2026-03-07T00:00:00Z', cancelled_at: null, created_at: '2026-03-07T00:00:00Z', updated_at: '2026-03-07T00:00:00Z' },
    { id: 406, property_id: 3, guest_id: 306, channel: 'direct', check_in: '2026-03-08', check_out: '2026-03-09', adults: 2, children: 0, infants: 0, nightly_rate: 3500, subtotal: 3500, cleaning_fee: 0, service_fee: 0, taxes: 0, gross_amount: 3500, commission_percent: 0, commission_amount: 0, net_amount: 3500, currency: 'INR', payment_status: 'paid', payment_method: 'UPI', paid_amount: 3500, pending_amount: 0, booking_status: 'checked_out', guest_message: '', special_requests: '', check_in_time: '2:00 PM', check_out_time: '11:00 AM', actual_check_in: null, actual_check_out: null, confirmed_at: '2026-03-08T00:00:00Z', cancelled_at: null, created_at: '2026-03-08T00:00:00Z', updated_at: '2026-03-08T00:00:00Z' },
    { id: 407, property_id: 3, guest_id: 307, channel: 'direct', check_in: '2026-03-10', check_out: '2026-03-11', adults: 7, children: 0, infants: 0, nightly_rate: 4500, subtotal: 4500, cleaning_fee: 0, service_fee: 0, taxes: 0, gross_amount: 4500, commission_percent: 0, commission_amount: 0, net_amount: 4500, currency: 'INR', payment_status: 'paid', payment_method: 'UPI', paid_amount: 4500, pending_amount: 0, booking_status: 'checked_out', guest_message: '', special_requests: '', check_in_time: '2:00 PM', check_out_time: '11:00 AM', actual_check_in: null, actual_check_out: null, confirmed_at: '2026-03-10T00:00:00Z', cancelled_at: null, created_at: '2026-03-10T00:00:00Z', updated_at: '2026-03-10T00:00:00Z' },
    { id: 408, property_id: 3, guest_id: 308, channel: 'direct', check_in: '2026-03-11', check_out: '2026-03-12', adults: 6, children: 0, infants: 0, nightly_rate: 3000, subtotal: 3000, cleaning_fee: 0, service_fee: 0, taxes: 0, gross_amount: 3000, commission_percent: 0, commission_amount: 0, net_amount: 3000, currency: 'INR', payment_status: 'paid', payment_method: 'UPI', paid_amount: 3000, pending_amount: 0, booking_status: 'checked_out', guest_message: '', special_requests: '', check_in_time: '2:00 PM', check_out_time: '11:00 AM', actual_check_in: null, actual_check_out: null, confirmed_at: '2026-03-11T00:00:00Z', cancelled_at: null, created_at: '2026-03-11T00:00:00Z', updated_at: '2026-03-11T00:00:00Z' },
    { id: 409, property_id: 3, guest_id: 309, channel: 'airbnb', check_in: '2026-03-12', check_out: '2026-03-13', adults: 4, children: 0, infants: 0, nightly_rate: 5788, subtotal: 5788, cleaning_fee: 0, service_fee: 0, taxes: 0, gross_amount: 5788, commission_percent: 3, commission_amount: 174, net_amount: 5614, currency: 'INR', payment_status: 'paid', payment_method: 'UPI', paid_amount: 5788, pending_amount: 0, booking_status: 'checked_out', guest_message: '', special_requests: '', check_in_time: '2:00 PM', check_out_time: '11:00 AM', actual_check_in: null, actual_check_out: null, confirmed_at: '2026-03-12T00:00:00Z', cancelled_at: null, created_at: '2026-03-12T00:00:00Z', updated_at: '2026-03-12T00:00:00Z' },
    { id: 410, property_id: 3, guest_id: 310, channel: 'direct', check_in: '2026-03-14', check_out: '2026-03-15', adults: 6, children: 1, infants: 0, nightly_rate: 3575, subtotal: 3575, cleaning_fee: 0, service_fee: 0, taxes: 0, gross_amount: 3575, commission_percent: 0, commission_amount: 0, net_amount: 3575, currency: 'INR', payment_status: 'paid', payment_method: 'UPI', paid_amount: 3575, pending_amount: 0, booking_status: 'checked_out', guest_message: '', special_requests: '', check_in_time: '2:00 PM', check_out_time: '11:00 AM', actual_check_in: null, actual_check_out: null, confirmed_at: '2026-03-14T00:00:00Z', cancelled_at: null, created_at: '2026-03-14T00:00:00Z', updated_at: '2026-03-14T00:00:00Z' },
    { id: 411, property_id: 3, guest_id: 311, channel: 'booking.com', check_in: '2026-03-15', check_out: '2026-03-16', adults: 4, children: 0, infants: 0, nightly_rate: 4040, subtotal: 4040, cleaning_fee: 0, service_fee: 0, taxes: 0, gross_amount: 4040, commission_percent: 15, commission_amount: 606, net_amount: 3434, currency: 'INR', payment_status: 'paid', payment_method: 'UPI', paid_amount: 4040, pending_amount: 0, booking_status: 'checked_out', guest_message: '', special_requests: '', check_in_time: '2:00 PM', check_out_time: '11:00 AM', actual_check_in: null, actual_check_out: null, confirmed_at: '2026-03-15T00:00:00Z', cancelled_at: null, created_at: '2026-03-15T00:00:00Z', updated_at: '2026-03-15T00:00:00Z' },
    { id: 412, property_id: 3, guest_id: 312, channel: 'direct', check_in: '2026-03-16', check_out: '2026-03-17', adults: 5, children: 0, infants: 0, nightly_rate: 3500, subtotal: 3500, cleaning_fee: 0, service_fee: 0, taxes: 0, gross_amount: 3500, commission_percent: 0, commission_amount: 0, net_amount: 3500, currency: 'INR', payment_status: 'partial', payment_method: 'UPI', paid_amount: 3500, pending_amount: 2040, booking_status: 'checked_out', guest_message: '', special_requests: '', check_in_time: '2:00 PM', check_out_time: '11:00 AM', actual_check_in: null, actual_check_out: null, confirmed_at: '2026-03-16T00:00:00Z', cancelled_at: null, created_at: '2026-03-16T00:00:00Z', updated_at: '2026-03-16T00:00:00Z' },
    { id: 413, property_id: 3, guest_id: 313, channel: 'direct', check_in: '2026-03-20', check_out: '2026-03-21', adults: 4, children: 0, infants: 0, nightly_rate: 3000, subtotal: 3000, cleaning_fee: 0, service_fee: 0, taxes: 0, gross_amount: 3000, commission_percent: 0, commission_amount: 0, net_amount: 3000, currency: 'INR', payment_status: 'partial', payment_method: 'UPI', paid_amount: 2000, pending_amount: 1000, booking_status: 'confirmed', guest_message: '', special_requests: 'Both single rooms blocked by Amit', check_in_time: '2:00 PM', check_out_time: '11:00 AM', actual_check_in: null, actual_check_out: null, confirmed_at: '2026-03-20T00:00:00Z', cancelled_at: null, created_at: '2026-03-20T00:00:00Z', updated_at: '2026-03-20T00:00:00Z' },
  ],
  expenses: [
    { id: 203, property_id: 0, category: 'staff_salary', description: 'Shaheen Salary', amount: 14000, payment_method: 'cash', vendor_name: '', expense_date: '2026-03-05', is_recurring: false, created_at: '2026-03-17T19:22:20.355Z', created_by: 'demo-001' },
    { id: 204, property_id: 0, category: 'staff_salary', description: 'Shaheen yearly Bonus', amount: 10000, payment_method: 'cash', vendor_name: '', expense_date: '2026-03-05', is_recurring: false, created_at: '2026-03-17T19:22:46.875Z', created_by: 'demo-001' },
    { id: 205, property_id: 0, category: 'cleaning', description: 'Shaheen Cleaning for Shivneri and Torna', amount: 1750, payment_method: 'cash', vendor_name: '', expense_date: '2026-03-05', is_recurring: false, created_at: '2026-03-17T19:23:41.634Z', created_by: 'demo-001' },
    { id: 206, property_id: 0, category: 'staff_salary', description: 'Jyotiba Advance Salary', amount: 20000, payment_method: 'cash', vendor_name: '', expense_date: '2026-03-05', is_recurring: false, created_at: '2026-03-17T19:32:37.852Z', created_by: 'demo-001' },
  ],

  channel_accounts: [
    { id: 1, channel_name: 'airbnb', account_id: '', api_key_encrypted: null, api_secret_encrypted: null, webhook_secret: null, is_active: true, commission_percent: 3, sync_enabled: true, last_sync: new Date().toISOString(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 2, channel_name: 'booking.com', account_id: '', api_key_encrypted: null, api_secret_encrypted: null, webhook_secret: null, is_active: true, commission_percent: 15, sync_enabled: true, last_sync: new Date().toISOString(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  ],

  availability: [],
  sync_logs: [],
  ical_links: [],
  messages: [],
  users: [{ id: 'demo-001', email: 'test@test.com', password_hash: '', name: 'Demo User', role: 'admin', created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' }],
};

// Initialize availability for all properties (30 days)
const today = new Date();
store.properties.forEach(prop => {
  for (let i = 0; i < 60; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    store.availability.push({
      id: nextId(),
      property_id: prop.id,
      date: d.toISOString().split('T')[0],
      rooms_available: prop.total_rooms,
      is_blocked: false,
      blocked_reason: null,
      min_stay: 1,
      max_stay: 30,
      closed_to_arrival: false,
      closed_to_departure: false,
      updated_at: new Date().toISOString(),
    });
  }
});

// ============ SQL PATTERN MATCHING QUERY ENGINE ============

const query = async (text, params = []) => {
  const sql = text.replace(/\s+/g, ' ').trim().toLowerCase();
  let replaced = text;
  params.forEach((p, i) => { replaced = replaced.replace(`$${i+1}`, JSON.stringify(p)); });

  // Helper: substitute params
  const p = (i) => params[i];

  try {
    // ---- USERS ----
    if (sql.includes('from users') && sql.includes('select')) {
      if (params.length > 0) {
        const found = store.users.filter(u => u.email === p(0) || u.id === p(0));
        return { rows: found, rowCount: found.length };
      }
      return { rows: store.users, rowCount: store.users.length };
    }
    if (sql.includes('insert into users')) {
      const user = { id: nextId(), email: p(0), password_hash: p(1), name: p(2), role: p(3) || 'manager', created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
      store.users.push(user);
      return { rows: [user], rowCount: 1 };
    }

    // ---- PROPERTIES ----
    if (sql.includes('from properties') && sql.includes('select') && !sql.includes('insert') && !sql.includes('update')) {
      // P&L / Revenue report query (joins with bookings, has date range)
      if (sql.includes('join bookings') || sql.includes('left join bookings')) {
        const active = store.properties.filter(pr => pr.is_active !== false);
        // Extract date range from SQL
        const dateMatch = replaced.match(/check_in\s*>=\s*'(\d{4}-\d{2}-\d{2})'[\s\S]*?check_in\s*<=\s*'(\d{4}-\d{2}-\d{2})'/i);
        const startDate = dateMatch ? dateMatch[1] : null;
        const endDate = dateMatch ? dateMatch[2] : null;
        const daysInMonth = endDate ? new Date(endDate).getDate() : 30;

        const rows = active.map(pr => {
          let bookings = store.bookings.filter(b => b.property_id === pr.id && b.booking_status !== 'cancelled');
          if (startDate && endDate) bookings = bookings.filter(b => b.check_in >= startDate && b.check_in <= endDate);
          const nightsSold = bookings.length;
          const nightsAvailable = (pr.total_rooms || 1) * daysInMonth;
          const occupancyPercent = nightsAvailable > 0 ? Math.round(nightsSold / nightsAvailable * 100 * 10) / 10 : 0;
          return {
            property_id: pr.id, property_name: pr.name, total_rooms: pr.total_rooms || 1,
            nights_sold: nightsSold, nights_available: nightsAvailable, available_nights: nightsAvailable,
            occupancy_percent: occupancyPercent, occupancy: occupancyPercent,
            gross_revenue: bookings.reduce((s, b) => s + (b.gross_amount || 0), 0),
            commission: bookings.reduce((s, b) => s + (b.commission_amount || 0), 0),
            net_revenue: bookings.reduce((s, b) => s + (b.net_amount || 0), 0),
            booked_nights: nightsSold, name: pr.name
          };
        });
        return { rows, rowCount: rows.length };
      }
      if (sql.includes('where') && sql.includes('id') && params.length > 0) {
        const prop = store.properties.find(pr => pr.id == p(0) && pr.is_active !== false);
        if (prop) {
          const avail = store.availability.filter(a => a.property_id === prop.id);
          return { rows: [{ ...prop, availability: avail }], rowCount: 1 };
        }
        return { rows: [], rowCount: 0 };
      }
      const active = store.properties.filter(pr => pr.is_active !== false);
      const enriched = active.map(pr => {
        const bookings = store.bookings.filter(b => b.property_id === pr.id && b.booking_status !== 'cancelled');
        const monthRevenue = bookings.reduce((s, b) => s + (b.net_amount || 0), 0);
        return { ...pr, current_bookings: bookings.length, month_revenue: monthRevenue };
      });
      return { rows: enriched, rowCount: enriched.length };
    }
    if (sql.includes('insert into properties')) {
      const prop = { id: nextId(), name: p(0), property_type: p(1), address: p(2), city: p(3), state: p(4), pincode: p(5), total_rooms: p(6), max_guests: p(7), base_price: p(8), description: p(9), amenities: p(10) || [], images: p(11) || [], latitude: p(12), longitude: p(13), google_maps_link: p(14), is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
      store.properties.push(prop);
      // Init availability
      for (let i = 0; i < 365; i++) {
        const d = new Date(); d.setDate(d.getDate() + i);
        store.availability.push({ id: nextId(), property_id: prop.id, date: d.toISOString().split('T')[0], rooms_available: prop.total_rooms || 1, is_blocked: false, blocked_reason: null, min_stay: 1, max_stay: 30, closed_to_arrival: false, closed_to_departure: false, updated_at: new Date().toISOString() });
      }
      return { rows: [prop], rowCount: 1 };
    }
    if (sql.includes('update properties')) {
      const prop = store.properties.find(pr => pr.id == params[params.length - 1]);
      if (prop) { prop.updated_at = new Date().toISOString(); Object.assign(prop, { name: p(0) || prop.name }); }
      return { rows: prop ? [prop] : [], rowCount: prop ? 1 : 0 };
    }

    // ---- AVAILABILITY ----
    if (sql.includes('from availability') && sql.includes('select')) {
      let avail = [...store.availability];
      if (params.length > 0) avail = avail.filter(a => a.property_id == p(0));
      if (params.length > 1) avail = avail.filter(a => a.date >= p(1));
      if (params.length > 2) avail = avail.filter(a => a.date <= p(2));
      return { rows: avail, rowCount: avail.length };
    }
    if (sql.includes('update availability')) {
      // Handle blocking/unblocking
      if (sql.includes('is_blocked')) {
        const propId = p(0);
        const startDate = params.length > 2 ? p(2) : p(1);
        const endDate = params.length > 3 ? p(3) : p(2);
        store.availability.forEach(a => {
          if (a.property_id == propId && a.date >= startDate && a.date <= endDate) {
            a.is_blocked = true;
            a.blocked_reason = params.length > 1 ? p(1) : 'Blocked';
          }
        });
      }
      return { rows: [], rowCount: 1 };
    }
    if (sql.includes('insert into availability') || sql.includes('on conflict')) {
      return { rows: [], rowCount: 1 };
    }

    // ---- BOOKINGS ----
    if (sql.includes('from bookings') && sql.includes('select') && !sql.includes('insert')) {
      const todayStr = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })).toISOString().split('T')[0];
      const enrich = (b) => {
        const prop = store.properties.find(pr => pr.id === b.property_id) || {};
        const guest = store.guests.find(g => g.id === b.guest_id) || {};
        return { ...b, property_name: prop.name, property_id: b.property_id, first_name: guest.first_name, last_name: guest.last_name, email: guest.email, phone: guest.phone, address: prop.address, google_maps_link: prop.google_maps_link, guest_name: `${guest.first_name || ''} ${guest.last_name || ''}`.trim(), guests: (b.adults||0) + (b.children||0) };
      };

      // Dashboard today stats (contains today_checkins/today_checkouts subqueries)
      if (sql.includes('today_checkins') || sql.includes('today_checkouts')) {
        const today_checkins = store.bookings.filter(b => b.check_in === todayStr && (b.booking_status === 'confirmed' || b.booking_status === 'checked-in')).length;
        const today_checkouts = store.bookings.filter(b => b.check_out === todayStr && b.booking_status === 'checked-in').length;
        const today_revenue = store.bookings.filter(b => b.check_in === todayStr && b.booking_status !== 'cancelled').reduce((s, b) => s + (b.net_amount || 0), 0);
        return { rows: [{ today_checkins, today_checkouts, today_revenue }], rowCount: 1 };
      }

      if (sql.includes('count(*)') || sql.includes('count(distinct')) {
        const count = store.bookings.filter(b => b.booking_status !== 'cancelled').length;
        return { rows: [{ count, total_bookings: count, cancelled_bookings: 0, total_gross: store.bookings.reduce((s,b) => s + b.gross_amount, 0), total_commission: store.bookings.reduce((s,b) => s + b.commission_amount, 0), total_net: store.bookings.reduce((s,b) => s + b.net_amount, 0), confirmed_bookings: count, unique_guests: new Set(store.bookings.map(b => b.guest_id)).size }], rowCount: 1 };
      }

      // Check-outs for today (check_out = CURRENT_DATE AND booking_status = 'checked-in')
      if (sql.includes('check_out') && (sql.includes('current_date') || sql.includes(`'${todayStr}'`)) && !sql.includes('check_in')) {
        const checkOuts = store.bookings.filter(b => b.check_out === todayStr && b.booking_status === 'checked-in');
        return { rows: checkOuts.map(enrich), rowCount: checkOuts.length };
      }

      // Currently staying guests (check_in <= today AND check_out > today AND checked-in)
      if (sql.includes('check_in') && sql.includes('<=') && sql.includes('check_out') && sql.includes('>')) {
        const staying = store.bookings.filter(b => b.check_in <= todayStr && b.check_out > todayStr && b.booking_status === 'checked-in');
        return { rows: staying.map(enrich), rowCount: staying.length };
      }

      // Today's check-ins (check_in = CURRENT_DATE AND confirmed/checked-in)
      if ((sql.includes('check_in') && sql.includes('current_date')) || (sql.includes('check_in') && sql.includes(`'${todayStr}'`) && !sql.includes('date_trunc') && !sql.includes('>='))) {
        const checkIns = store.bookings.filter(b => b.check_in === todayStr && (b.booking_status === 'confirmed' || b.booking_status === 'checked-in'));
        const checkOuts = store.bookings.filter(b => b.check_out === todayStr && b.booking_status === 'checked-in');
        return { rows: checkIns.map(enrich), rowCount: checkIns.length, _checkOuts: checkOuts.map(enrich) };
      }

      // Upcoming bookings (check_in >= today AND confirmed)
      if (sql.includes('check_in') && sql.includes('>=') && sql.includes('confirmed')) {
        const upcoming = store.bookings.filter(b => b.check_in >= todayStr && b.booking_status === 'confirmed').sort((a, b) => a.check_in.localeCompare(b.check_in)).slice(0, 5);
        return { rows: upcoming.map(enrich), rowCount: upcoming.length };
      }

      // Single booking
      if (sql.includes('where') && sql.includes('.id') && params.length === 1) {
        const booking = store.bookings.find(b => b.id == p(0));
        if (booking) {
          const prop = store.properties.find(pr => pr.id === booking.property_id) || {};
          const guest = store.guests.find(g => g.id === booking.guest_id) || {};
          return { rows: [{ ...booking, property_name: prop.name, first_name: guest.first_name, last_name: guest.last_name, email: guest.email, phone: guest.phone }], rowCount: 1 };
        }
        return { rows: [], rowCount: 0 };
      }
      // All bookings with enrichment
      let bookings = [...store.bookings];
      const enriched = bookings.map(b => enrich(b));
      return { rows: enriched, rowCount: enriched.length };
    }
    if (sql.includes('insert into bookings')) {
      const booking = {
        id: nextId(), property_id: p(0), guest_id: p(1), channel: p(2) || 'direct', channel_booking_id: p(3),
        check_in: p(4), check_out: p(5), adults: p(6) || 1, children: p(7) || 0, infants: p(8) || 0,
        nightly_rate: p(9) || 0, subtotal: p(10) || 0, cleaning_fee: p(11) || 0, service_fee: p(12) || 0, taxes: p(13) || 0,
        gross_amount: p(14) || 0, commission_percent: p(15) || 0, commission_amount: p(16) || 0, net_amount: p(17) || 0,
        currency: 'INR', payment_status: p(18) || 'pending', payment_method: p(19),
        guest_message: p(20) || '', special_requests: p(21) || '',
        check_in_time: p(22) || '2:00 PM', check_out_time: p(23) || '11:00 AM',
        booking_status: 'confirmed', actual_check_in: null, actual_check_out: null,
        confirmed_at: new Date().toISOString(), cancelled_at: null, cancellation_reason: null,
        created_at: new Date().toISOString(), updated_at: new Date().toISOString()
      };
      store.bookings.push(booking);
      return { rows: [booking], rowCount: 1 };
    }
    if (sql.includes('update bookings')) {
      const id = params[params.length - 1];
      const booking = store.bookings.find(b => b.id == id);
      if (booking) {
        booking.updated_at = new Date().toISOString();
        if (sql.includes('booking_status')) booking.booking_status = p(0);
        if (sql.includes('cancelled_at')) { booking.cancelled_at = new Date().toISOString(); booking.cancellation_reason = p(1) || 'Cancelled'; }
      }
      return { rows: booking ? [booking] : [], rowCount: booking ? 1 : 0 };
    }

    // ---- GUESTS ----
    if (sql.includes('from guests') && sql.includes('select') && !sql.includes('insert')) {
      if (sql.includes('count(*)')) {
        let guests = store.guests;
        if (params.length > 0 && p(0)) {
          const search = p(0).replace(/%/g, '').toLowerCase();
          guests = guests.filter(g => (g.first_name + ' ' + g.last_name + ' ' + g.email + ' ' + g.phone).toLowerCase().includes(search));
        }
        return { rows: [{ count: guests.length, total_guests: guests.length, total_stays: guests.reduce((s,g) => s + g.total_stays, 0), total_revenue: guests.reduce((s,g) => s + g.lifetime_value, 0), avg_lifetime_value: guests.length ? Math.round(guests.reduce((s,g) => s + g.lifetime_value, 0) / guests.length) : 0, repeat_guests: guests.filter(g => g.total_stays > 1).length }], rowCount: 1 };
      }
      // VIP
      if (sql.includes('total_stays >= 3') || sql.includes('lifetime_value >= 50000')) {
        const vips = store.guests.filter(g => g.total_stays >= 3 || g.lifetime_value >= 50000);
        return { rows: vips, rowCount: vips.length };
      }
      // Single guest
      if (sql.includes('where') && sql.includes('.id') && params.length === 1) {
        const guest = store.guests.find(g => g.id == p(0));
        return { rows: guest ? [guest] : [], rowCount: guest ? 1 : 0 };
      }
      // Search
      if (params.length > 0 && p(0) && typeof p(0) === 'string' && p(0).includes('%')) {
        const search = p(0).replace(/%/g, '').toLowerCase();
        const found = store.guests.filter(g => (g.first_name + ' ' + g.last_name + ' ' + g.email + ' ' + g.phone).toLowerCase().includes(search));
        return { rows: found, rowCount: found.length };
      }
      return { rows: store.guests, rowCount: store.guests.length };
    }
    if (sql.includes('insert into guests')) {
      const guest = {
        id: nextId(), first_name: p(0), last_name: p(1), email: p(2), phone: p(3),
        id_proof_type: p(4), id_proof_number: p(5), id_proof_encrypted: p(6),
        address: p(7), date_of_birth: p(8), nationality: p(9),
        total_stays: 0, total_spent: 0, lifetime_value: 0,
        preferences: p(10) || '', notes: p(11) || '',
        created_at: new Date().toISOString(), updated_at: new Date().toISOString()
      };
      store.guests.push(guest);
      return { rows: [{ ...guest, isNew: true }], rowCount: 1 };
    }
    if (sql.includes('update guests')) {
      const id = params[params.length - 1];
      const guest = store.guests.find(g => g.id == id);
      if (guest) { guest.updated_at = new Date().toISOString(); }
      return { rows: guest ? [guest] : [], rowCount: guest ? 1 : 0 };
    }

    // ---- EXPENSES ----
    if (sql.includes('from expenses') && sql.includes('select')) {
      if (sql.includes('count(*)')) {
        return { rows: [{ count: store.expenses.length }], rowCount: 1 };
      }
      if (sql.includes('group by') && sql.includes('category')) {
        const byCategory = {};
        store.expenses.forEach(e => {
          if (!byCategory[e.category]) byCategory[e.category] = { category: e.category, total: 0, count: 0 };
          byCategory[e.category].total += e.amount;
          byCategory[e.category].count++;
        });
        return { rows: Object.values(byCategory), rowCount: Object.keys(byCategory).length };
      }
      if (sql.includes('group by') && sql.includes('property')) {
        const byProp = {};
        store.expenses.forEach(e => {
          const prop = store.properties.find(pr => pr.id === e.property_id) || { name: 'Unknown' };
          if (!byProp[e.property_id]) byProp[e.property_id] = { property_id: e.property_id, property_name: prop.name, total: 0 };
          byProp[e.property_id].total += e.amount;
        });
        return { rows: Object.values(byProp), rowCount: Object.keys(byProp).length };
      }
      // All expenses
      const enriched = store.expenses.map(e => {
        const prop = store.properties.find(pr => pr.id === e.property_id) || {};
        return { ...e, property_name: prop.name };
      });
      return { rows: enriched, rowCount: enriched.length };
    }
    if (sql.includes('insert into expenses')) {
      const expense = {
        id: nextId(), property_id: p(0), category: p(1), subcategory: p(2),
        description: p(3), amount: p(4), payment_method: p(5) || 'cash',
        vendor_name: p(6), receipt_number: p(7), expense_date: p(8) || new Date().toISOString().split('T')[0],
        is_recurring: p(9) || false, recurring_frequency: p(10),
        created_at: new Date().toISOString(), created_by: 'demo-001'
      };
      store.expenses.push(expense);
      return { rows: [expense], rowCount: 1 };
    }
    if (sql.includes('update expenses')) {
      const id = params[params.length - 1];
      const expense = store.expenses.find(e => e.id == id);
      if (expense) { Object.assign(expense, {}); }
      return { rows: expense ? [expense] : [], rowCount: expense ? 1 : 0 };
    }
    if (sql.includes('delete from expenses')) {
      const idx = store.expenses.findIndex(e => e.id == p(0));
      if (idx >= 0) store.expenses.splice(idx, 1);
      return { rows: [], rowCount: idx >= 0 ? 1 : 0 };
    }

    // ---- CHANNEL ACCOUNTS ----
    if (sql.includes('from channel_accounts') && sql.includes('select')) {
      if (params.length > 0) {
        const found = store.channel_accounts.filter(c => c.id == p(0) || c.channel_name === p(0));
        return { rows: found, rowCount: found.length };
      }
      return { rows: store.channel_accounts, rowCount: store.channel_accounts.length };
    }
    if (sql.includes('update channel_accounts')) {
      const id = params[params.length - 1];
      const ch = store.channel_accounts.find(c => c.id == id);
      if (ch) { ch.updated_at = new Date().toISOString(); }
      return { rows: ch ? [ch] : [], rowCount: ch ? 1 : 0 };
    }

    // ---- SYNC LOGS ----
    if (sql.includes('from sync_logs')) {
      return { rows: store.sync_logs, rowCount: store.sync_logs.length };
    }
    if (sql.includes('insert into sync_logs')) {
      const log = { id: nextId(), channel: p(0), sync_type: p(1), status: p(2) || 'success', records_processed: p(3) || 0, errors: null, started_at: new Date().toISOString(), completed_at: new Date().toISOString() };
      store.sync_logs.push(log);
      return { rows: [log], rowCount: 1 };
    }

    // ---- MESSAGES ----
    if (sql.includes('from messages')) {
      return { rows: store.messages, rowCount: store.messages.length };
    }

    // ---- GENERIC FALLBACK ----
    console.log('[MockDB] Unhandled query:', sql.substring(0, 80));
    return { rows: [], rowCount: 0 };

  } catch (err) {
    console.error('[MockDB] Query error:', err.message, 'SQL:', sql.substring(0, 80));
    return { rows: [], rowCount: 0 };
  }
};

// Transaction helper - just runs the callback with a mock client
const transaction = async (callback) => {
  const mockClient = {
    query: async (text, params) => {
      if (text === 'BEGIN' || text === 'COMMIT' || text === 'ROLLBACK') return { rows: [], rowCount: 0 };
      return query(text, params);
    },
    release: () => {}
  };
  return callback(mockClient);
};

// Mock pool
const pool = {
  query: query,
  connect: async () => ({
    query: async (text, params) => {
      if (text === 'BEGIN' || text === 'COMMIT' || text === 'ROLLBACK') return { rows: [], rowCount: 0 };
      return query(text, params);
    },
    release: () => {}
  }),
  on: () => {},
};

console.log('[MockDB] In-memory database initialized with demo data');

module.exports = {
  pool,
  query,
  transaction,
  text: (...args) => query(...args),
  store, // expose for direct access if needed
};
