import React, { Component } from "react";

import Loading from "./Loading";
import Panel from "./Panel";
import {
  getTotalInterviews,
  getLeastPopularTimeSlot,
  getMostPopularDay,
  getInterviewsPerDay
} from "helpers/selectors";

import { setInterview } from "helpers/reducers";

import classnames from "classnames";
import axios from "axios";

//Fake data to remove later
const data = [
  {
    id: 1,
    label: "Total Interviews",
    getValue: getTotalInterviews
  },
  {
    id: 2,
    label: "Least Popular Time Slot",
    getValue: getLeastPopularTimeSlot
  },
  {
    id: 3,
    label: "Most Popular Day",
    getValue: getMostPopularDay
  },
  {
    id: 4,
    label: "Interviews Per Day",
    getValue: getInterviewsPerDay
  }
];


class Dashboard extends Component {

  //initial state
  state = { 
    loading: true,
    focused: null,
    days: [],
    appointments: {},
    interviewers: {}
  };

  //use json.parse to convert string to javascript 
  componentDidMount() {
    const focused = JSON.parse(localStorage.getItem("focused"));

    if (focused) {
      this.setState({ focused });
    }

    Promise.all([
      axios.get("/api/days"),
      axios.get("/api/appointments"),
      axios.get("/api/interviewers")
    ]).then(([days, appointments, interviewers]) => {
      this.setState({
        loading: false,
        days: days.data,
        appointments: appointments.data,
        interviewers: interviewers.data
      });
    });

    //open websocket connection
    this.socket = new WebSocket(process.env.REACT_APP_WEBSOCKET_URL);

    this.socket.onmessage = event => {
      const data = JSON.parse(event.data);
    
      if (typeof data === "object" && data.type === "SET_INTERVIEW") {
        this.setState(previousState =>
          setInterview(previousState, data.id, data.interview)
        );
      }
    };
  }

  //closing websocket connection when it unmounts
  componentWillUnmount() {
    this.socket.close();
  }

  //need to use Json.stringify to convert our values before writing them to local storage
  componentDidUpdate(previousProps, previousState) {
    if (previousState.focused !== this.state.focused) {
      localStorage.setItem("focused", JSON.stringify(this.state.focused));
    }
  }

  //set focused state based on id of panel using Class Property w Arrow Function
  // selectPanel= id  => {
  //   this.setState({
  //     focused: id
  //   });
  // }

  selectPanel(id) {
    this.setState(previousState => ({
      focused: previousState.focused !== null ? null : id
    }));
  }


  render() {
    const dashboardClasses = classnames("dashboard", {
      "dashboard--focused": this.state.focused
    });

    //if loading state is true, render loading page
    if (this.state.loading) {
      return <Loading />;
    }

    const panels = data.filter(
      panel => this.state.focused === null || this.state.focused === panel.id
    )
    .map((panel) => {
      return (
        <Panel
          key={panel.id}
          label={panel.label}
          value={panel.getValue(this.state)}
          onSelect={event => this.selectPanel(panel.id)}
        />
      );
    })

    return <main className={dashboardClasses}>{panels}</main>;
  }
}

export default Dashboard;
