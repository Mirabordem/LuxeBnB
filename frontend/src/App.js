import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { Switch, Route } from "react-router-dom";
import * as sessionActions from "./store/session";
import Navigation from "./components/Navigation";
import AllSpots from "./components/AllSpots/AllSpots";
import SpotDetails from "./components/SpotDetails/SpotDetails";
import ManageSpots from "./components/ManageSpots/ManageSpots";
import UpdateSpotForm from "./components/UpdateSpotForm/UpdateSpotForm";
import CreateSpotForm from "./components/CreateSpotForm/CreateSpotForm";
import UserBookings from "./components/Bookings/UserBookings";
import Footer from "./components/Footer/Footer";

function App() {
  const dispatch = useDispatch();
  const [isLoaded, setIsLoaded] = useState(false);
  useEffect(() => {
    dispatch(sessionActions.restoreUser()).then(() => setIsLoaded(true));
  }, [dispatch]);

  return (
    <>
      <Navigation isLoaded={isLoaded} />
      {isLoaded && (
        <Switch>
          <Route exact path="/">
            <AllSpots />
          </Route>
          <Route exact path="/spots/current">
            <ManageSpots />
          </Route>
          <Route exact path="/spots/new">
            <CreateSpotForm />
            </Route>
          <Route exact path="/spots/:spotId">
            <SpotDetails />
          </Route>
          <Route exact path="/spots/:spotId/edit">
            <UpdateSpotForm />
          </Route>
          <Route exact path="/bookings">
          <UserBookings />
        </Route>
        </Switch>
      )}
      <Footer />
    </>
  );
}

export default App;
