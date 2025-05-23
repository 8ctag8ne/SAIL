import React from "react";
import "./Card.css";
type Props = {};
const Card = (props: Props) => {
    return (
        <div className="card">
            <div className = "details">
                <h2>AAPL</h2>
                <p>110</p>
            </div>
            <p className="info">
                Lorem ipsum dolor sit amet consectetur adipisicing elit. Blanditiis, ipsam. Culpa veritatis repudiandae earum aliquam recusandae, iusto vel eligendi error ad placeat odio quis, laudantium aspernatur accusamus voluptatum quos neque?
            </p>
        </div>
    );
};
export default Card;