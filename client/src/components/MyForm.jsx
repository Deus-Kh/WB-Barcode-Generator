import React, {useState} from 'react';
import {Button, Checkbox, Form, Input, Select,Upload} from 'antd'
import { PlusOutlined,UploadOutlined } from '@ant-design/icons';
const formData ={};
function MyForm({ formData, handleChange, handleSubmit, isLoading, frameOptions, fontOptions }) {
  
    return ( <Form>
        <Form.Item name="barcodeType" label="Gender" rules={[{ required: true }]}>
        <Select
          placeholder="Select a option and change input text above"
        //   onChange={}
          allowClear
          defaultValue={"code128"}
        >
          <Select.Option  value="code128">Code128</Select.Option>
          <Select.Option value="ean13">EAN-13</Select.Option>
          <Select.Option value="ean8">EAN-8</Select.Option>
          <Select.Option value="upc">UPC</Select.Option>
        </Select>
      </Form.Item>
      <Form.Item name="barcodeValue" label="Barcode Value" rules={[{ required: true }]}>
          <Input type='text' placeholder='Barcode value' value={formData.barcodeValue}></Input>
      </Form.Item>
      <Form.Item name="seller" label="Seller" >
          <Input type='text' placeholder='Seller' value={formData.seller}></Input>
      </Form.Item>
      <Form.Item name="productName" label="Product Name" >
          <Input type='text' placeholder='Product Name' value={formData.productName}></Input>
      </Form.Item>
      <Form.Item name="article" label="Article" >
          <Input type='text' placeholder='Article' value={formData.article}></Input>
      </Form.Item>
      <Form.Item name="color" label="Color" >
          <Input type='text' placeholder='Color' value={formData.color}></Input>
      </Form.Item>
      <Form.Item name="size" label="Size" >
          <Input type='text' placeholder='Size' value={formData.size}></Input>
      </Form.Item>
      <Form.Item name="expirationDate" label="Expiration Date" >
          <Input type='text' placeholder='Expiration Date' value={formData.expirationDate}></Input>
      </Form.Item>
      <Form.Item name="country" label="Country" >
          <Input type='text' placeholder='Country' value={formData.country}></Input>
      </Form.Item>
      <Form.Item name="brand" label="Brand" >
          <Input type='text' placeholder='Brand' value={formData.brand}></Input>
      </Form.Item>
      <Form.Item name="customText" label="Custom Text" >
          <Input type='text' placeholder='Barcode value' value={formData.customText}></Input>
      </Form.Item>

      {/* checkboxes */}
      <Form.Item name="showSeller" valuePropName="checked"  label={null}>
        <Checkbox checked={formData.showSeller}>Include Seller</Checkbox>
      </Form.Item>
      <Form.Item name="showArticle" valuePropName="checked"  label={null}>
        <Checkbox checked={formData.showArticle}>Include Article</Checkbox>
      </Form.Item>
      <Form.Item name="showColor" valuePropName="checked"  label={null}>
        <Checkbox checked={formData.showColor}>Include Color</Checkbox>
      </Form.Item>
      <Form.Item name="showSize" valuePropName="checked"  label={null}>
        <Checkbox checked={formData.showSize}>Include Size</Checkbox>
      </Form.Item>
      <Form.Item name="showExpirationDate" valuePropName="checked"  label={null}>
        <Checkbox checked={formData.showExpirationDate}>Include Expiration Date</Checkbox>
      </Form.Item>
      <Form.Item name="showCountry" valuePropName="checked"  label={null}>
        <Checkbox checked={formData.showCountry}>Include Country</Checkbox>
      </Form.Item>
      <Form.Item name="showBrand" valuePropName="checked"  label={null}>
        <Checkbox checked={formData.showBrand}>Include Brand</Checkbox>
      </Form.Item>
      <Form.Item name="showEac" valuePropName="checked"  label={null}>
        <Checkbox checked={formData.showEac}>Include EAC Mark</Checkbox>
      </Form.Item>
      <Form.Item name="showNoReturn" valuePropName="checked"  label={null}>
        <Checkbox checked={formData.showNoReturn}>Include "No Return" Text</Checkbox>
      </Form.Item>
      <Form.Item label="SVG Logo" valuePropName="logo" >
          <Upload onChange={handleChange}  multiple={false} accept='image/svg+xml'>
          <Button icon={<UploadOutlined />}>Click to Upload</Button>
            
          </Upload>
        </Form.Item>
        <Form.Item name="frame" label="Frame" >
        <Select
          placeholder="Select a option and change input text above"
        //   onChange={}
          allowClear
          defaultValue={formData.frame}
          options={frameOptions}

        >
          {frameOptions.map((option, index)=>{
            <Select.Option key={index} value={option.value}>{option.label}</Select.Option>
          })}
          
        </Select>
        </Form.Item>
    </Form> );
}

export default MyForm;