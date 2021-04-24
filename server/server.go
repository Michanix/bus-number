package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	_ "github.com/go-sql-driver/mysql"
	"github.com/gorilla/mux"
)

var (
	baseUrl = "/api/v1/bus-stops"
	port    = 8080
	addr    = fmt.Sprintf("localhost:%d", port)
)

type Location struct {
	Latitude  float64 `json:"lat"`
	Longitude float64 `json:"lon"`
}

func checkErr(err error) {
	if err != nil {
		log.Panic(err.Error())
	}
}

func dbConn() (db *sql.DB) {
	driver := "mysql"
	user := os.Getenv("DB_USER")
	pass := os.Getenv("DB_PASS")
	dbName := os.Getenv("DB_NAME")
	address := os.Getenv("DB_URL")
	dataSourceName := fmt.Sprintf(
		"%s:%s@tcp(%s)/%s?parseTime=true",
		user, pass, address, dbName)

	db, err := sql.Open(driver, dataSourceName)

	checkErr(err)
	db.SetConnMaxLifetime(time.Minute)
	db.SetMaxOpenConns(10)
	db.SetConnMaxIdleTime(10)
	log.Println("Database connection established")

	return db
}

func setupCorsResponse(w *http.ResponseWriter, req *http.Request) {
	(*w).Header().Set("Access-Control-Allow-Origin", "*")
	(*w).Header().Set(
		"Access-Control-Allow-Methods",
		"POST, GET, OPTIONS, PUT, DELETE")
	(*w).Header().Set(
		"Access-Control-Allow-Headers",
		"Accept, Content-Length, Authorization")
	(*w).Header().Set("Content-Type", "application/json")
}

func getColumnStringValues(query string) []string {
	result := []string{}
	db := dbConn()
	defer db.Close()

	rows, err := db.Query(query)

	checkErr(err)

	for rows.Next() {
		var value string
		rows.Scan(&value)
		result = append(result, value)
	}

	return result
}

func AreasHandler(w http.ResponseWriter, r *http.Request) {
	setupCorsResponse(&w, r)
	query := `
	SELECT DISTINCT stop_area
	FROM stops 
	WHERE stop_area <> ""
	ORDER BY stop_area ASC;`

	stopAreas := getColumnStringValues(query)
	areas, err := json.MarshalIndent(&stopAreas, "", "  ")
	checkErr(err)

	w.Write(areas)
}

func AreaStopsHandler(w http.ResponseWriter, r *http.Request) {
	setupCorsResponse(&w, r)
	vars := mux.Vars(r)
	query := fmt.Sprintf(`
	SELECT DISTINCT stop_name 
	FROM stops 
	WHERE stop_area = '%s' 
	ORDER BY stop_name ASC;`, vars["area"])

	stopNames := getColumnStringValues(query)
	names, err := json.MarshalIndent(&stopNames, "", "  ")
	checkErr(err)

	w.Write(names)
}

func BusNumbersHandler(w http.ResponseWriter, r *http.Request) {
	setupCorsResponse(&w, r)
	vars := mux.Vars(r)
	query := fmt.Sprintf(`
	SELECT DISTINCT routes.route_short_name
	FROM stops, routes, trips, stop_times
	WHERE stops.stop_id = stop_times.stop_id
	AND stop_times.trip_id = trips.trip_id
	AND trips.route_id = routes.route_id
	AND stops.stop_area = '%s'
	AND stops.stop_name = '%s'
	ORDER BY stops.stop_area DESC
	`, vars["area"], vars["stop_name"])

	busNumbers := getColumnStringValues(query)
	numbers, err := json.MarshalIndent(&busNumbers, "", "  ")
	checkErr(err)

	w.Write(numbers)
}

func ClosestAreaHandler(w http.ResponseWriter, r *http.Request) {
	setupCorsResponse(&w, r)
	var location Location
	json.NewDecoder(r.Body).Decode(&location)
	query := fmt.Sprintf(`
	SELECT stop_area, stop_name, (6371 * acos(
		cos(radians(%f)) * cos(radians(stops.stop_lat)) 
		* cos(radians(stops.stop_lon) - radians(%f))
		+ sin(radians(%f)) * sin(radians(stops.stop_lat)))
		) as dist
	FROM stops
	ORDER BY dist ASC
	LIMIT 1;	
	`, location.Latitude, location.Longitude, location.Latitude)

	stops := make(map[string]string)
	db := dbConn()
	defer db.Close()

	rows, err := db.Query(query)
	checkErr(err)

	for rows.Next() {
		var area, stop string
		var dist float64
		rows.Scan(&area, &stop, &dist)
		stops["area"] = area
		stops["stop"] = stop
	}

	result, err := json.MarshalIndent(&stops, "", "  ")
	checkErr(err)

	w.Write(result)
}

func formatDepartureQuery(
	area string, stopName string, busNumber string, operator string, limit int) string {
	query := fmt.Sprintf(`
	SELECT stop_times.arrival_time, trips.trip_long_name
	from stops, trips, stop_times, routes
	WHERE stops.stop_id = stop_times.stop_id
	AND stop_times.trip_id = trips.trip_id
	AND trips.route_id = routes.route_id
	AND stops.stop_area = '%s'
	AND stops.stop_name = '%s'
	AND routes.route_short_name = '%s'
	AND stop_times.arrival_time %s CURRENT_TIMESTAMP()
	GROUP BY stop_times.arrival_time
	LIMIT %d;
	`, area, stopName, busNumber, operator, limit)

	return query
}

func getArrivalTimes(query string) []map[string]string {
	db := dbConn()
	defer db.Close()

	rows, err := db.Query(query)
	checkErr(err)

	arrivalTimes := make([]map[string]string, 0)

	for rows.Next() {
		var arrival, route string
		times := make(map[string]string)
		rows.Scan(&arrival, &route)
		times["arrival"] = arrival
		times["route"] = route
		arrivalTimes = append(arrivalTimes, times)
	}

	return arrivalTimes
}

func DepartureTimesHandler(w http.ResponseWriter, r *http.Request) {
	setupCorsResponse(&w, r)
	vars := mux.Vars(r)
	query := formatDepartureQuery(vars["area"], vars["stop_name"], vars["bus_number"], ">", 5)
	arrivalTimes := getArrivalTimes(query)

	if len(arrivalTimes) < 5 {
		limit := 5 - len(arrivalTimes)
		query := formatDepartureQuery(vars["area"], vars["stop_name"], vars["bus_number"], "<", limit)
		rest := getArrivalTimes(query)
		arrivalTimes = append(arrivalTimes, rest...)
	}

	result, err := json.MarshalIndent(&arrivalTimes, "", "  ")
	checkErr(err)

	w.Write(result)
}

func main() {
	router := mux.NewRouter()
	apiRouter := router.PathPrefix(baseUrl).Subrouter()
	apiRouter.HandleFunc("/areas", AreasHandler).Methods(http.MethodGet)
	apiRouter.HandleFunc("/areas/closest", ClosestAreaHandler).Methods(http.MethodPost)
	apiRouter.HandleFunc("/areas/{area}", AreaStopsHandler).Methods(http.MethodGet)
	apiRouter.HandleFunc("/areas/{area}/{stop_name}", BusNumbersHandler).Methods(http.MethodGet)
	apiRouter.HandleFunc("/areas/{area}/{stop_name}/{bus_number}", DepartureTimesHandler).Methods(http.MethodGet)
	apiRouter.Use(mux.CORSMethodMiddleware(apiRouter))

	srv := &http.Server{
		Handler:      router,
		Addr:         addr,
		WriteTimeout: 15 * time.Second,
		ReadTimeout:  15 * time.Second,
	}

	log.Default().Printf("Starting server on http://%s%s/", addr, baseUrl)
	log.Fatal(srv.ListenAndServe())
}
