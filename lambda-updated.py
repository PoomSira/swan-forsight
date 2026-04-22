#!/usr/bin/env python3
"""
Modbus Vulnerability Scanner Lambda Function
Adapted from FoxESS scanner logic to work with any Modbus device
"""

from pymodbus.client import ModbusTcpClient
from pymodbus.exceptions import ModbusException
import json
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

MODBUS_VULNERABILITIES = {
    "no_auth": {
        "severity": "HIGH",
        "description": "Modbus has no built-in authentication mechanism",
        "recommendation": "Implement network-level access controls, use firewall rules, or deploy Modbus proxy with authentication"
    },
    "no_encryption": {
        "severity": "HIGH",
        "description": "Modbus traffic is unencrypted",
        "recommendation": "Use Modbus over TLS/SSL or implement VPN/network encryption"
    },
    "broadcast_available": {
        "severity": "MEDIUM",
        "description": "Modbus broadcast function (FC17) may be enabled",
        "recommendation": "Disable broadcast functions on the Modbus server if not required"
    }
}

def lambda_handler(event, context):
    """
    Main Lambda handler for Modbus vulnerability scanning
    
    Event format:
    {
        "device_ip": "192.168.1.100",
        "modbus_port": 502,
        "timeout": 5
    }
    """
    try:
        # Extract parameters from event
        device_ip = event.get("device_ip") or event.get("modbus_ip")
        modbus_port = event.get("modbus_port", 502)
        timeout = event.get("timeout", 3)
        
        if not device_ip:
            return {
                "statusCode": 400,
                "body": json.dumps({
                    "error": "Missing device_ip parameter",
                    "success": False
                })
            }
        
        logger.info(f"Scanning Modbus device at {device_ip}:{modbus_port} (timeout: {timeout}s)")
        
        # Attempt to connect to Modbus device with short timeout
        client = ModbusTcpClient(
            device_ip, 
            port=modbus_port, 
            timeout=timeout,
            retries=1
        )
        
        connection_successful = False
        try:
            logger.info(f"Attempting to connect to {device_ip}:{modbus_port}...")
            connection_successful = client.connect()
        except Exception as connect_error:
            logger.warning(f"Connection attempt error: {str(connect_error)}")
        
        if not connection_successful:
            logger.warning(f"Failed to connect to {device_ip}:{modbus_port}")
            return {
                "statusCode": 503,
                "body": json.dumps({
                    "device_ip": device_ip,
                    "port": modbus_port,
                    "status": "unreachable",
                    "vulnerabilities": [],
                    "success": False,
                    "message": f"Cannot reach Modbus device at {device_ip}:{modbus_port} - Check device IP, firewall, and Lambda VPC configuration"
                })
            }
        
        try:
            # Test read operation (Function Code 3 - Read Holding Registers)
            logger.info(f"Connected! Attempting to read registers...")
            response = client.read_holding_registers(0, 1, slave=1)
            
            vulnerabilities = []
            
            # If we can read without authentication, that's a vulnerability
            if response and not isinstance(response, Exception):
                vulnerabilities.append({
                    "type": "no_auth",
                    **MODBUS_VULNERABILITIES["no_auth"]
                })
                logger.info(f"Vulnerability detected: No authentication required on {device_ip}")
            
            # Check for encryption - Modbus TCP has no built-in encryption
            vulnerabilities.append({
                "type": "no_encryption",
                **MODBUS_VULNERABILITIES["no_encryption"]
            })
            
            logger.info(f"Scan completed for {device_ip}. Found {len(vulnerabilities)} vulnerabilities.")
            
            return {
                "statusCode": 200,
                "body": json.dumps({
                    "device_ip": device_ip,
                    "port": modbus_port,
                    "status": "scanned",
                    "vulnerabilities": vulnerabilities,
                    "count": len(vulnerabilities),
                    "success": True,
                    "message": f"Successfully scanned {device_ip}"
                })
            }
            
        except Exception as scan_error:
            logger.error(f"Error during scan: {str(scan_error)}")
            return {
                "statusCode": 500,
                "body": json.dumps({
                    "device_ip": device_ip,
                    "status": "error",
                    "error": str(scan_error),
                    "success": False,
                    "message": f"Error scanning device: {str(scan_error)}"
                })
            }
        finally:
            try:
                client.close()
            except:
                pass
            
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}", exc_info=True)
        return {
            "statusCode": 500,
            "body": json.dumps({
                "error": str(e),
                "success": False,
                "message": "An unexpected error occurred during the scan"
            })
        }
