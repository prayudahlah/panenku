const Input = ({ label, name, type = 'text', ...props }) => {
  return (
    <div className="input-group">
      {label && <label htmlFor={name}>{label}</label>}
      <input id={name} name={name} type={type} {...props} />
    </div>
  );
};

export default Input;
