<!DOCTYPE html>

<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Book a Service - Prosper's Services</title>

<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700&display=swap" rel="stylesheet">

<!-- Flatpickr Calendar -->

<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css">
<script src="https://cdn.jsdelivr.net/npm/flatpickr"></script>

<style>

body{
    font-family:Poppins, sans-serif;
    background:#f5f7fb;
    margin:0;
    padding:0;
}

.booking-container{
    max-width:900px;
    margin:50px auto;
    background:white;
    padding:30px;
    border-radius:12px;
    box-shadow:0 10px 30px rgba(0,0,0,0.1);
}

h1{
    text-align:center;
    margin-bottom:25px;
}

.times{
    display:grid;
    grid-template-columns:repeat(3,1fr);
    gap:12px;
    margin-bottom:25px;
}

.time{
    padding:14px;
    border:2px solid #4f6cff;
    border-radius:10px;
    text-align:center;
    cursor:pointer;
    transition:0.2s;
}

.time:hover{
    background:#4f6cff;
    color:white;
}

.time.selected{
    background:#4f6cff;
    color:white;
}

input, select{
    width:100%;
    padding:14px;
    margin-top:12px;
    border-radius:10px;
    border:1px solid #ccc;
    font-size:16px;
}

button{
    background:#4f6cff;
    color:white;
    border:none;
    cursor:pointer;
    padding:14px;
    margin-top:18px;
    border-radius:10px;
    font-size:16px;
    width:100%;
}

button:hover{
    background:#354edb;
}

/* ===== CALENDAR AVAILABILITY COLOURS ===== */

/* make each day a circle */
.flatpickr-day{
    border-radius:50% !important;
}

/* FULL availability (green) */
.flatpickr-day.available-full{
    background:#28c76f !important;
    color:white !important;
    border:none !important;
}

/* SOME availability (yellow) */
.flatpickr-day.available-some{
    background:#ffcc00 !important;
    color:black !important;
    border:none !important;
}

/* NO availability (red) */
.flatpickr-day.available-none{
    background:#ff4d4f !important;
    color:white !important;
    border:none !important;
}

/* today outline */
.flatpickr-day.today{
    border:2px solid #4f6cff !important;
}

</style>

</head>

<body>

<div class="booking-container">

```
<h1>Book Your Service</h1>

<h3>Select a Date</h3>
<input id="datePicker" placeholder="Click to select a date" readonly>

<h3>Select a Time</h3>
<div id="times" class="times"></div>

<input id="bookingName" placeholder="Full Name" required>
<input id="bookingPhone" placeholder="Phone Number" required>

<label style="margin-top:15px;font-weight:600;">Select Service</label>
<select id="service">
    <option value="">Choose a service...</option>
    <option value="Pressure Cleaning">Pressure Cleaning</option>
    <option value="Gardening">Gardening</option>
    <option value="Gutter Cleaning">Gutter Cleaning</option>
</select>

<div id="subServiceContainer" style="display:none;">
    <label id="subLabel" style="margin-top:15px;font-weight:600;">
        What do you want done?
    </label>
    <select id="subService"></select>
</div>

<button id="book">Confirm Booking</button>
```

</div>

<script type="module" src="booking.js"></script>

</body>
</html>
