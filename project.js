homeAutomation = `
Home automation refers to the use of technology to control and manage various household systems—such as lighting, heating, air conditioning, security cameras, locks, and appliances—remotely or automatically, typically through a smartphone, tablet, or voice assistant. By integrating devices via a central hub or network (like Wi-Fi, Zigbee, or Z-Wave), home automation enables users to schedule actions (e.g., lights dimming at sunset), monitor their home in real time from anywhere, and create interconnected routines (e.g., unlocking the door triggers the hallway lights). Beyond convenience, this smart technology enhances energy efficiency, home security, and comfort, allowing for a personalized and responsive living environment.
`

metroApp = `
The Metro Management System is a C++-based software solution that uses Data Structures and Algorithms (DSA) to improve metro rail operations by enhancing efficiency, safety, and passenger convenience. The system includes modules for user interaction, ticket management, route planning, and train scheduling, allowing passengers to purchase tickets, find optimal routes, and receive real-time travel information. It uses arrays to store station names, graphs and maps to represent the metro network, and priority queues in Dijkstra’s Algorithm to calculate the shortest and most efficient routes between stations. The project also utilizes the Standard Template Library (STL) for better performance, maintainability, and real-time scheduling and monitoring functionalities, making metro operations smarter and more reliable.
`

ptnMng = `
A Patient Management System (PMS) is a digital healthcare software platform designed to streamline the administrative and clinical workflows of a medical practice, hospital, or clinic. It centralizes patient data—including demographics, medical histories, appointment schedules, billing records, prescriptions, and lab results—into a single, accessible database. By automating tasks such as appointment booking, patient check-ins, insurance claims, and follow-up reminders, a PMS reduces paperwork and manual errors, allowing healthcare providers to focus more on patient care. It also enhances communication between different departments and improves the overall patient experience by ensuring faster access to accurate information, facilitating remote access to records, and supporting continuity of care across multiple visits.
`

smartRover = `
This project presents an IoT-enabled autonomous waste collector designed to address urban waste management challenges such as bin overflow, inefficient collection routes, and health hazards. Using a robot equipped with a Raspberry Pi 4, camera, robotic arm, sensors (IR, load cell, ultrasonic), and Arduino-based controllers, the system visually detects waste bins via OpenCV, collects garbage with its servo-controlled arm, and monitors fill levels in real time. When a bin is full, the robot navigates autonomously to a dump site before resuming collection. Data from the sensors is transmitted via MQTT or HTTP over Wi-Fi to a cloud dashboard, where analytics help optimize collection frequency and routing. A mobile or web interface provides tracking and alerts, ultimately reducing carbon footprint, improving urban hygiene, and offering a scalable, data-driven solution for smart cities and beyond.
`

voiceAssistant = `
This is project details 5............
`

voiceControl = `
This is project details 6............
`


document.getElementById('homeAutomation').innerHTML = homeAutomation
document.getElementById('metroApp').innerHTML = metroApp
document.getElementById('ptnMng').innerHTML = ptnMng
document.getElementById('smartRover').innerHTML = smartRover
document.getElementById('voiceAssistant').innerHTML = voiceAssistant
document.getElementById('voiceControl').innerHTML = voiceControl