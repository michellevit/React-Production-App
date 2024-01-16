import axios from "axios";
import BoxForm from "./BoxForm";
import BoxList from "./BoxList";
import DatePicker from "react-datepicker";
import DeleteButton from "./DeleteButton";
import EditButton from "./EditButton";
import React, { useState, useEffect } from "react";
import MinimizeCardButton from "./MinimizeCardButton";
import NoteList from "./NoteList";
import { parseISO } from "date-fns";
import ReadyButton from "./ReadyButton";
import ShippedButton from "./ShippedButton";
import SuggestedDims from "./SuggestedDims";
import "./OrderCard.css";
import "react-datepicker/dist/react-datepicker.css";

const OrderCard = ({
  order,
  orders,
  setOrders,
  setShowErrorModal,
  setErrorMessage,
  minimizeMaximizeAction,
}) => {
  const [isRemoving, setIsRemoving] = useState(false);
  const [shipDate, setShipDate] = useState("");
  const [confirmedStatus, setConfirmedStatus] = useState(false);
  const [delayDate, setDelayDate] = useState();
  const [tbdStatus, setTBDStatus] = useState(false);
  const [boxes, setBoxes] = useState([]);
  const [formDisplay, setFormDisplay] = useState([]);
  const [notes, setNotes] = useState([]);
  const [readyStatus, setReadyStatus] = useState(false);
  const [matchingDims, setMatchingDims] = useState("");
  const [suggestedBoxes, setSuggestedBoxes] = useState([]);
  const [minimized, setMinimized] = useState(() => {
    const minimizedStatus = localStorage.getItem(`order_minimized_${order.id}`);
    return minimizedStatus ? JSON.parse(minimizedStatus) : true;
  });
  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_BACKEND_URL}/open-orders/${order.id}/`
        );
        if (response.data) {
          const {
            ready,
            ship_date,
            confirmed,
            delay_date,
            delay_tbd,
            packages_array,
            notes_array,
            item_dict_hash,
          } = response.data;
          const updatedBoxes = Array.isArray(packages_array)
            ? packages_array.map((box) => {
                if (typeof box.ready === true) {
                  setFormDisplay(false);
                } else if (box.ready === false) {
                  setFormDisplay(true);
                }
                return box;
              })
            : [];
          setConfirmedStatus(confirmed);
          const formattedDelayDate = delay_date ? parseISO(delay_date) : null;
          setDelayDate(formattedDelayDate);
          setTBDStatus(delay_tbd);
          setBoxes(updatedBoxes);
          setNotes(notes_array);
          setReadyStatus(ready);
          const minimizedStatus = localStorage.getItem(
            `order_minimized_${order.id}`
          );
          setMinimized(minimizedStatus ? JSON.parse(minimizedStatus) : true);
          setShipDate(formatDate(ship_date));
          if (ship_date === null) {
            if (delay_date === null) {
              checkTBD(true);
            } else {
              checkTBD(false);
            }
          }
          if (
            packages_array.length === 0 &&
            matchingDims !== false &&
            item_dict_hash !== "0"
          ) {
            axios
              .post("${process.env.REACT_APP_BACKEND_URL}/fetch-matching-packages/", {
                item_dict: order.item_dict,
              })
              .then((response) => {
                if (response.data.success) {
                  setMatchingDims(true);
                  setSuggestedBoxes(response.data.packages_array);
                } else {
                  setMatchingDims(false);
                }
              })
              .catch((error) => {
                console.error("Error fetching matching packages:", error);
              });
          } else {
            setMatchingDims(false);
          }
        }
      } catch (error) {
        console.error("Error fetching order details:", error);
      }
    };
    fetchOrderDetails();
  }, [
    order.id,
    order.confirmed,
    order.delay_tbd,
    order.delay_date,
    order.ship_date,
    order.packages_array,
    order.minimized_status,
    minimizeMaximizeAction,
  ]);

  function formatDate(inputDate) {
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const dateParts = inputDate.split("-");
    const year = parseInt(dateParts[0], 10);
    const month = parseInt(dateParts[1], 10) - 1;
    const day = parseInt(dateParts[2], 10);
    const dateObj = new Date(Date.UTC(year, month, day));
    const formattedDate = `${
      months[dateObj.getUTCMonth()]
    } ${dateObj.getUTCDate()}, ${dateObj.getUTCFullYear()}`;
    return formattedDate;
  }

  const readyHandler = async () => {
    setReadyStatus(true);
    setConfirmedStatus(true);
    boxFormHandler();
    setDelayDate(null);
    const updatedOrder = order;
    updatedOrder.ready = true;
    updatedOrder.confirmed = true;
    updatedOrder.delay_date = null;
    try {
      await axios.put(
        `${process.env.REACT_APP_BACKEND_URL}/open-orders/${order.id}/`,
        updatedOrder
      );
    } catch (error) {
      console.error("Error updating order:", error);
    }
  };

  const editHandler = async () => {
    setReadyStatus(false);
    const updatedOrder = order;
    updatedOrder.ready = false;
    try {
      await axios.put(
        `${process.env.REACT_APP_BACKEND_URL}/open-orders/${order.id}/`,
        updatedOrder
      );
    } catch (error) {
      console.error("Error updating order:", error);
    }
  };

  const shippedHandler = async () => {
    const shippedOrderID = order.id;
    const updatedOrder = order;
    updatedOrder.shipped = true;
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, "0");
    const day = String(currentDate.getDate()).padStart(2, "0");
    const formattedCurrentDate = `${year}-${month}-${day}`;
    updatedOrder.ship_date = formattedCurrentDate;
    updatedOrder.minimized = true;
    try {
      await axios.put(
        `${process.env.REACT_APP_BACKEND_URL}/open-orders/${order.id}/`,
        updatedOrder
      );
      setIsRemoving(true);
      setTimeout(() => {
        setOrders(
          orders.filter((orderItem) => orderItem.id !== shippedOrderID)
        );
        setIsRemoving(false);
      }, 300);
      // Remove minimized status from local storage
      localStorage.removeItem(`order_minimized_${order.id}`);
    } catch (error) {
      console.error("Error updating order:", error);
    }
  };

  const updateDelayDate = async (date) => {
    try {
      const formattedDate = date ? date.toISOString().split("T")[0] : null;
      if (formattedDate !== null) {
        setTBDStatus(false);
        setConfirmedStatus(false);
      }
      const updatedOrder = order;
      updatedOrder.delay_date = formattedDate;
      updatedOrder.delay_tbd = false;
      updatedOrder.confirmed = false;
      await axios.put(
        `${process.env.REACT_APP_BACKEND_URL}/open-orders/${order.id}/`,
        updatedOrder
      );
    } catch (error) {
      console.error("Error updating order:", error);
    }
  };

  const checkTBD = async (tbdBoolean) => {
    setTBDStatus(tbdBoolean);
    setConfirmedStatus(false);
    const updatedOrder = order;
    updatedOrder.delay_tbd = tbdBoolean;
    try {
      await axios.put(
        `${process.env.REACT_APP_BACKEND_URL}/open-orders/${order.id}/`,
        updatedOrder
      );
    } catch (error) {
      console.error("Error updating order:", error);
    }
  };

  const handleTBD = async () => {
    let newStatus = !tbdStatus;
    setConfirmedStatus(false);
    if (newStatus === false && order.ship_date === null) {
      newStatus = true;
    } else if (newStatus === false && order.ship_date !== null) {
      newStatus = false;
    }
    setTBDStatus(newStatus);
    setDelayDate(null);
    const updatedOrder = order;
    updatedOrder.delay_date = null;
    updatedOrder.delay_tbd = newStatus;
    updatedOrder.confirmed = false;
    try {
      await axios.put(
        `${process.env.REACT_APP_BACKEND_URL}/open-orders/${order.id}/`,
        updatedOrder
      );
    } catch (error) {
      console.error("Error updating order:", error);
    }
  };

  const handleConfirmed = async () => {
    let newStatus = !confirmedStatus;
    const updatedOrder = order;
    updatedOrder.confirmed = !confirmedStatus;
    setConfirmedStatus(newStatus);
    try {
      await axios.put(
        `${process.env.REACT_APP_BACKEND_URL}/open-orders/${order.id}/`,
        updatedOrder
      );
    } catch (error) {
      console.error("Error updating order:", error);
    }
  };

  const boxFormHandler = () => {
    if (readyStatus) {
      setFormDisplay(false);
    } else {
      setFormDisplay(true);
    }
  };

  const updatePackages = async (boxes) => {
    try {
      const updatedOrder = order;
      updatedOrder.packages_array = boxes;
      await axios.put(
        `${process.env.REACT_APP_BACKEND_URL}/open-orders/${order.id}/`,
        updatedOrder
      );
    } catch (error) {
      console.error("Error updating order:", error);
    }
  };
  const updateNotes = async (newNotes) => {
    try {
      const updatedOrder = order;
      updatedOrder.notes_array = newNotes;
      await axios.put(
        `${process.env.REACT_APP_BACKEND_URL}/open-orders/${order.id}/`,
        updatedOrder
      );
    } catch (error) {
      console.error("Error updating order:", error);
    }
  };

  const toggleMinimize = () => {
    setMinimized((prevState) => {
      const newState = !prevState;
      localStorage.setItem(
        `order_minimized_${order.id}`,
        JSON.stringify(newState)
      );
      return newState;
    });
  };

  return (
    <div
      className={`card-container ${
        order.quote
          ? "quoted-order-card"
          : !order.quote && order.confirmed && !order.ready
          ? "confirmed-order-card"
          : !order.quote && confirmedStatus && readyStatus
          ? "ready-order-card"
          : ""
      } ${isRemoving ? "card-container-fade-out" : ""} ${
        (delayDate !== null || tbdStatus === true) &&
        !readyStatus &&
        !order.quote
          ? "delayed-order-card"
          : ""
      }`}
    >
      <div className="row" id="row1">
        <div id="row1-row1">
          <div id="row1col1"></div>
          <div className="order-number-container" id="row1col2">
            <div className="order-number-text">
              {order.quote ? "Quote#" : `SO#`} {order.order_number}
            </div>
          </div>
          <div id="row1col3">
            <MinimizeCardButton
              minimized={minimized}
              toggleMinimize={toggleMinimize}
            />
            <DeleteButton
              order={order}
              orders={orders}
              setOrders={setOrders}
              setIsRemoving={setIsRemoving}
            />
          </div>
        </div>
        {minimized ? (
          <div id="min-customer-info">
            {order.customer_name}
            <br></br>
            {tbdStatus ? "TBD" : shipDate}
          </div>
        ) : null}
      </div>
      {!minimized && (
        <div className="row" id="row2">
          <table className="card-data-table">
            <tbody>
              <tr className="order-data" id="customer-name">
                <td className="row2col1">Customer:</td>
                <td className="row2col2" colSpan="2">
                  {order.customer_name}
                </td>
              </tr>
              <tr className="order-data" id="ship-date">
                <td className="row2col1">Ship Date:</td>
                <td className="row2col2">{tbdStatus ? "TBD" : shipDate}</td>
                <td className="row2col3">
                  {!order.ready &&
                    !order.quote &&
                    !tbdStatus &&
                    order.delay_date == null && (
                      <input
                        type="checkbox"
                        id="order-card-confirmed-checkbox"
                        checked={confirmedStatus}
                        onChange={handleConfirmed}
                      ></input>
                    )}
                  {!order.ready &&
                    !order.quote &&
                    !tbdStatus &&
                    order.delay_date == null &&
                    "Confirmed"}
                </td>
              </tr>
              {!readyStatus && !order.quote && (
                <tr className="order-data" id="delay-date">
                  <td className="row2col1">Delay:</td>
                  <td className="row2col2">
                    <DatePicker
                      suffixIcon={null}
                      placeholderText="n/a"
                      selected={delayDate}
                      onChange={(date) => {
                        updateDelayDate(date);
                        setDelayDate(date);
                      }}
                      isClearable
                      className="delay-input"
                    />
                  </td>
                  <td className="row2col3">
                    {!order.quote && (
                      <input
                        type="checkbox"
                        id="order-card-tbd-checkbox"
                        checked={tbdStatus}
                        onChange={handleTBD}
                      ></input>
                    )}
                    {!order.quote && "TBD"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      {!minimized && (
        <div className="row" id="row3">
          <table className="items-table">
            <tbody>
              <tr>
                <th id="item">Item</th>
                <th id="qty">Qty.</th>
              </tr>
              {order.item_array.map((item, index) => (
                <tr key={index}>
                  <td id="item">
                    {item.name} {item.description}
                  </td>
                  <td id="qty">
                    {item.ship_qty}
                    {item.backorder_qty > 0 && (
                      <p id="backorder-text">
                        B/O: {item.backorder_qty}
                      </p>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {!minimized && (
        <div
          className="row"
          id={readyStatus && notes.length === 0 ? "row4-ready-nonotes" : "row4"}
        >
          <div className="dimensions-container">
            {boxes.length === 0 && readyStatus ? (
              <p className="no-box-message">
                No dimensions/weight info. added.
              </p>
            ) : (
              ""
            )}
            <BoxForm
              formDisplay={formDisplay}
              setFormDisplay={setFormDisplay}
              setBoxes={setBoxes}
              boxes={boxes}
              readyStatus={readyStatus}
              updatePackages={updatePackages}
              setShowErrorModal={setShowErrorModal}
              setErrorMessage={setErrorMessage}
            />
            {boxes.length > 0 && (
              <BoxList
                boxes={boxes}
                setBoxes={setBoxes}
                readyStatus={readyStatus}
                updatePackages={updatePackages}
              />
            )}
            {matchingDims && !readyStatus && (
              <SuggestedDims
                suggestedBoxes={suggestedBoxes}
                setBoxes={setBoxes}
                setMatchingDims={setMatchingDims}
                order={order}
              />
            )}
          </div>
        </div>
      )}
      {!minimized && !(readyStatus && notes.length === 0) && (
        <div className="row" id="row5">
          <div className="note-container">
            <NoteList
              readyStatus={readyStatus}
              notes={notes}
              setNotes={setNotes}
              updateNotes={updateNotes}
            />
          </div>
        </div>
      )}
      {!minimized && (
        <div className="row" id="row6">
          <div className="row6-buttons-container">
            {!readyStatus && (
              <ReadyButton readyHandler={readyHandler} order={order} />
            )}
            {readyStatus && <EditButton editHandler={editHandler} />}
            {readyStatus && !order.quote && (
              <ShippedButton
                shippedHandler={shippedHandler}
                setIsRemoving={setIsRemoving}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};
export default OrderCard;
