const domain = {
  name: "Pxls x Argent",
};

const types = {
  StarkNetDomain: [
    {
      name: "name",
      type: "felt",
    },
  ],
  Message: [
    {
      name: "message",
      type: "felt",
    },
  ],
};

const messageToSign = {
  domain,
  types,
  primaryType: "Message",
  message: {
    message: "Pxls x Argent signature",
  },
};

export default messageToSign;
